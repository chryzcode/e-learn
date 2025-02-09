import "dotenv/config";
import axios from "axios";


export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Alaba Olanrewaju - E-Learn", email: process.env.BREVO_SENDER },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
      }
    );

    console.log("Email sent successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error sending email:", error.response?.data || error.message);
    throw new Error("Failed to send email");
  }
};
