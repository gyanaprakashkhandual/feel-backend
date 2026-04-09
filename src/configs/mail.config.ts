import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const DEFAULT_FROM = {
    email: process.env.SENDGRID_FROM_EMAIL!,
    name: process.env.SENDGRID_FROM_NAME!,
};

interface MailAttachment {
    content: string;
    filename: string;
    type?: string;
    disposition?: "attachment" | "inline";
}

interface SendMailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: { email: string; name: string };
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: MailAttachment[];
    templateId?: string;
    dynamicTemplateData?: Record<string, unknown>;
}

interface SendBulkOptions {
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    personalizations: {
        to: string;
        dynamicTemplateData?: Record<string, unknown>;
    }[];
}

async function sendMail(options: SendMailOptions) {
    const {
        to,
        subject,
        text,
        html,
        from = DEFAULT_FROM,
        replyTo,
        cc,
        bcc,
        attachments,
        templateId,
        dynamicTemplateData,
    } = options;

    const msg = {
        to,
        from,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(replyTo && { replyTo }),
        ...(cc && { cc }),
        ...(bcc && { bcc }),
        ...(attachments && { attachments }),
        ...(templateId && { templateId }),
        ...(dynamicTemplateData && { dynamicTemplateData }),
    } as sgMail.MailDataRequired;

    const [response] = await sgMail.send(msg);
    return { statusCode: response.statusCode, headers: response.headers };
}

async function sendTemplateMail(
    to: string | string[],
    templateId: string,
    dynamicTemplateData: Record<string, unknown>,
    overrides: Partial<SendMailOptions> = {}
) {
    return sendMail({
        to,
        subject: "",
        templateId,
        dynamicTemplateData,
        ...overrides,
    });
}

async function sendBulkMail(options: SendBulkOptions) {
    const { subject, text, html, templateId, personalizations } = options;

    const messages = personalizations.map((p) => ({
        to: p.to,
        from: DEFAULT_FROM,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(templateId && { templateId }),
        ...(p.dynamicTemplateData && {
            dynamicTemplateData: p.dynamicTemplateData,
        }),
    })) as sgMail.MailDataRequired[];

    const responses = await sgMail.send(messages);
    return responses;
}

async function sendWelcomeMail(to: string, name: string) {
    return sendMail({
        to,
        subject: "Welcome!",
        html: `<h1>Welcome, ${name}!</h1><p>We're glad to have you.</p>`,
        text: `Welcome, ${name}! We're glad to have you.`,
    });
}

async function sendPasswordResetMail(to: string, resetLink: string) {
    return sendMail({
        to,
        subject: "Password Reset Request",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        text: `Reset your password: ${resetLink} — expires in 1 hour.`,
    });
}

async function sendOtpMail(to: string, otp: string) {
    return sendMail({
        to,
        subject: "Your OTP Code",
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
}

export {
    sendMail,
    sendTemplateMail,
    sendBulkMail,
    sendWelcomeMail,
    sendPasswordResetMail,
    sendOtpMail,
    SendMailOptions,
    SendBulkOptions,
    MailAttachment,
};