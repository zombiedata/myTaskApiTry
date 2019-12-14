const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmails = (email, name) => {
    sgMail.send({
        to: email,
        from: "zombiechauhan@gmail.com",
        subject: "test mail",
        // text: `Hiiii , Welcome to task App ${name}, hope you able to manage your all the task with this taks app`
        text: `test test test test test test test test test test test test  email`

    })
}

const cancelEmailAccount = (email, name) => {
    sgMail.send({
        to: email,
        from: "rohitchauhan.24196@gmail.com",
        subject: "send grid mail service",
        text: `Hiiii , sorry leave you task App ${name}, hope you enjoy our service`
    })
}



module.exports = {
    sendWelcomeEmails,
    cancelEmailAccount
}