"use strict";
const nodemailer = require('nodemailer');
require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

var whitelist = process.env.WHITELISTED.split(':::');
var supported = ['pdf', 'jpg', 'gif', 'tif', 'bmp', 'png', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];

bot.on('message', async ctx => {

  if (!(whitelist.indexOf(ctx.message.from.id.toString()) >= 0)) return;
  if (!ctx.message.document) {
    ctx.reply("Send a file to print")
    return;
  }
  if (ctx.message.document.file_size > 20971520) {
    ctx.reply("Your file is too big, size limit is 20mb");
    return;
  }

  if (!(supported.indexOf(ctx.message.document.file_name.split('.')[1]) >= 0)) {
    ctx.reply(`Unsupported file type. Supported types: \n${supported.toString()}`)
    return;
  }

  var fileLink = await bot.telegram.getFileLink(ctx.message.document.file_id);

  await createEmail(fileLink, ctx);

  ctx.reply("File is sent to the printer")

});

async function createEmail(fileLink, ctx) {

  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: string_to_bool(process.env.SMTP_SECURE),
    auth: {
      user: process.env.ACCOUNT_USERNAME,
      pass: process.env.ACCOUNT_PASSWORD
    },
  });

  let info = await transporter.sendMail({
    from: `"${ctx.message.from.username}" <${process.env.ACCOUNT_USERNAME}>`,
    to: process.env.PRINTER_EMAIL,
    subject: "Telegram print query",
    text: `From @${ctx.message.from.username}`,
    attachments: [
      {
        filename: ctx.message.document.file_name,
        path: fileLink
      }
    ]
  });
}

function string_to_bool (item) {
  item = item.toLowerCase();
	return ["true", "1"].indexOf(item) >= 0;
};

bot.launch().then(console.log("Bot is launched"));