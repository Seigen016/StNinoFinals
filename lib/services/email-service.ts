import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

 interface EmailOptions {
        to: string;
        subject: string;
        text: string;
        html?: string;
 }   

interface LoginCredentials {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'parent' | 'teacher';
  loginUrl: string;
}

export class EmailService {

   static async sendEmail(options: EmailOptions): Promise<void> {
      try {
        let response = await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        console.log(`Email sent: ${response.messageId}`);
      }catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    }

    static async sendLoginCredentials(credentials: LoginCredentials): Promise<void> {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                border: 1px solid #ddd;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #2c3e50;
                margin: 0;
              }
              .credentials {
                background-color: #fff;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #3498db;
              }
              .credentials p {
                margin: 10px 0;
              }
              .credentials strong {
                color: #2c3e50;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .login-button {
                display: inline-block;
                background-color: #3498db;
                color: #ffffff !important;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
              }
              .login-button:hover {
                background-color: #2980b9;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #7f8c8d;
                font-size: 14px;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to St. Niño Portal</h1>
              </div>
              
              <p>Dear ${credentials.name},</p>
              
              <p>Your account has been successfully created. Below are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${credentials.email}</p>
                <p><strong>Password:</strong> ${credentials.password}</p>
                <p><strong>Role:</strong> ${credentials.role.charAt(0).toUpperCase() + credentials.role.slice(1)}</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
              </div>
              
              <div class="button-container">
                <a href="${credentials.loginUrl}" class="login-button">Login to Portal</a>
              </div>
              
              <div class="footer">
                <p>If you have any questions or need assistance, please contact the administrator.</p>
                <p>&copy; ${new Date().getFullYear()} St. Niño Portal. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const text = `
Welcome to St. Niño Portal

Dear ${credentials.name},

Your account has been successfully created. Below are your login credentials:

Email: ${credentials.email}
Password: ${credentials.password}
Role: ${credentials.role.charAt(0).toUpperCase() + credentials.role.slice(1)}

Please change your password after your first login for security purposes.

Login here: ${credentials.loginUrl}

If you have any questions or need assistance, please contact the administrator.

© ${new Date().getFullYear()} St. Niño Portal. All rights reserved.
      `;

      await this.sendEmail({
        to: credentials.email,
        subject: 'Welcome to St. Niño Portal - Your Login Credentials',
        text: text,
        html: html,
      });
    }

}