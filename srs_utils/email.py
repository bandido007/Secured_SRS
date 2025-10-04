import os
import socket
from django.template.loader import render_to_string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader 

from dotenv import dotenv_values

config = dotenv_values(".env")



class EmailNotifications:
    def send_email_notification(emailBody, html_template , user):
            EMAIL_HOST = config.get('EMAIL_HOST' , os.environ.get('EMAIL_HOST'))
            EMAIL_PASSWORD = config.get('EMAIL_HOST_PASSWORD' , os.environ.get('EMAIL_HOST_PASSWORD'))
            EMAIL_USER = config.get('EMAIL_HOST_USER' , os.environ.get('EMAIL_HOST_USER'))
            EMAIL_PORT = config.get('EMAIL_PORT' , os.environ.get('EMAIL_HOST'))
            DEFAULT_FROM_EMAIL = config.get('DEFAULT_FROM_EMAIL' , os.environ.get('EMAIL_HOST'))
            
            html_content = render_to_string(html_template, {'data': emailBody})
            
            # Create a Jinja2 environment with the HTML template
            env = Environment(loader=FileSystemLoader(html_template))
            template = env.from_string(html_content)

            # Render the template with the provided context
            rendered_template = template.render({'data': emailBody})
        
            # Create a multipart message and set the headers
            msg = MIMEMultipart()
            msg['From'] = DEFAULT_FROM_EMAIL
            msg['To'] = emailBody['receiver_details']
            msg['Subject'] = emailBody['subject']

            # Attach the rendered HTML content as the email body
            msg.attach(MIMEText(rendered_template, 'html'))
            
            # Create a secure SSL/TLS connection to the SMTP server
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.set_debuglevel(1)
            server.starttls()

            # Login to the email account
            server.login(EMAIL_USER, EMAIL_PASSWORD)

            # Send the email
            server.sendmail(DEFAULT_FROM_EMAIL, emailBody['receiver_details'], msg.as_string())

            # Disconnect from the server
            server.quit()
