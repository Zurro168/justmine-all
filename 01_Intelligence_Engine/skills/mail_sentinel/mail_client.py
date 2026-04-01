import imaplib
import smtplib
from email.message import EmailMessage
import os
from imap_tools import MailBox, AND
import logging

class MailSentinelClient:
    def __init__(self, user, password, imap_server, smtp_server):
        self.user = user
        self.password = password
        self.imap_server = imap_server
        self.smtp_server = smtp_server
        self.logger = logging.getLogger("MailSentinelClient")

    def fetch_unread_emails(self):
        """获取所有未读邮件"""
        emails = []
        try:
            # Attempt STARTTLS on port 143 for better compatibility
            with MailBox(self.imap_server, port=143).starttls(self.user, self.password) as mailbox:
                for msg in mailbox.fetch(AND(seen=False)):
                    emails.append({
                        "id": msg.uid,
                        "from": msg.from_,
                        "subject": msg.subject,
                        "date": msg.date,
                        "text": msg.text,
                        "html": msg.html
                    })
        except Exception as e:
            self.logger.error(f"Failed to fetch emails: {str(e)}")
        return emails

    def send_reply(self, to_email, subject, body):
        """发送回复邮件"""
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = f"Re: {subject}"
        msg['From'] = self.user
        msg['To'] = to_email

        try:
            with smtplib.SMTP_SSL(self.smtp_server, 465) as smtp:
                smtp.login(self.user, self.password)
                smtp.send_message(msg)
            return True
        except Exception as e:
            self.logger.error(f"Failed to send email: {str(e)}")
            return False
