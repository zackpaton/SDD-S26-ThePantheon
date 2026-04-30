/**
 * Email transport factory for sending Gmail messages (e.g. event reminder
 * notifications).
 */
const nodemailer = require('nodemailer');

/**
 * Builds a nodemailer transporter using EMAIL_USER / EMAIL_PASS from the
 * environment.
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

module.exports = {createTransporter};
