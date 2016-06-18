# steamBotTemplate

**Please don't create an issue if you need help - join gitter chat. Thanks.**

[![Join the chat at https://gitter.im/bulgakovk/steamBot](https://badges.gitter.im/bulgakovk/steamBot.svg)](https://gitter.im/bulgakovk/steamBot?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**What is 2FA.js?**
>It's script which provides you to enable mobile authentication in Steam.

**How to use 2FA.js?**
>Be sure that you have **attached mobile number** for your steam accout before doing these steps (do it [here](store.steampowered.com/account/)). You can use one number for several accounts btw.

>P.S. I really want to make a simple web-site with activation mobile auth functionality so If you have free VPS or want to become a sponsor - let me know.

>Here are 4 simple steps:

>1)Download 2FA.js file.

>2)Install node package using [npm](https://www.npmjs.com/). Just write this code in console:
>>npm install steamcommunity

>3) You will see the interactive part of script. Put your Steam login name/password/code from e-mail/code from SMS when you see the appropriate commands. 

>4) If all was correct you're going to see **"2fa finalized sucessfly"**. Now you have new file with your shared and identity secrets in your directory. Good job!

**What is shared_secret?**
>Secret string using to generate one time passwords to login into Steam.

**What is identity_secret?**
>Secret string using to generate one time passwords to accept outgoing trade offers.

**What is bot.js?**
> It's template for your bot. The most important things which it provides for you are login to steam using new Escrow system and accept offers, using automaticly generated codes. **It is not final solution for jackpot or other sites!** But you can do whatever you want using this template.

**Where bot gets items prices?**
>https://bitskins.com/api

**How to run bot.js**
>Don't forget to change login/password and all secrets in source!
>Install these node packages using [npm](https://www.npmjs.com/):

>>steam-user

>>steam-tradeoffer-manager

>>steam-totp

>>steamcommunity-mobile-confirmations

>>onceler

>>request


