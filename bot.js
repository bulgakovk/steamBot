var SteamUser = require('steam-user');
var TradeOfferManager = require('steam-tradeoffer-manager');
var SteamTotp = require('steam-totp');
var TOTP = require('onceler').TOTP;
var request = require('request');
//Don't forget to put valid info
var API_KEY           = ""; // API key from bitskins.com
var SECRET            = ""; // Secret key from bitskins.com
var polling_interval  = 10000; // 10 seconds
var totp = new TOTP(SECRET);
var client = new SteamUser();

var manager = new TradeOfferManager({
    "steam"    : client,
    "domain"   : "localhost",
    "language" : "en"
})

var details = {
	"accountName"   : "YOUR_STEAM_ACCOUNT_NAME",
	"password"      : "YOUR_PASSWORD",
	"twoFactorCode" : SteamTotp.generateAuthCode("YOUR_SHARED_SECRET")
};
client.logOn(details);

//Generating device_id
var device_id = SteamTotp.getDeviceID("SteamID");

client.on('loggedOn', function(details){
    console.log("Logged ON!");
});

client.on('webSession', function(sessionID, cookies){
        //Setting manager
        manager.setCookies(cookies, function(err) {
        if(err) {
            console.log(err);
            process.exit(1); // Fatal error since we couldn't get our API key
            return;
        }
        // Write API key if it's OK.
        console.log("Got API key: " + manager.apiKey);
        var SteamcommunityMobileConfirmations = require('steamcommunity-mobile-confirmations');
        var steamcommunityMobileConfirmations = new SteamcommunityMobileConfirmations(
        {
            steamid:         "YOUR_STEAM_ID",
            identity_secret: "YOUR_IDENTITY_SECRET",
            device_id:       device_id,
            webCookie:       cookies,
        });
        //Checking mobile confirmations and accept it.
        //Be carefull with this function.
        setInterval(function(){
            checkConfirmations(steamcommunityMobileConfirmations)
        }, polling_interval);
	});
});
    
manager.on('newOffer', function(offer) {
    offer.getEscrowDuration(function(err, daysTheirEscrow, daysMyEscrow){
        if (err) console.log(err);
        else {
            if (daysTheirEscrow != 0) offer.decline(function(err){
                if (err) console.log(err);
            });
            else {
                var checker = true;
                var itemsString = "";
                var items = offer.itemsToReceive;
                var itemsObj = new Array(items.length);
                items.forEach(function(item, i , arr){
                    if (item.appid != 730 || item.market_hash_name.indexOf("Souvenir") != -1) 
                        checker = false;
                    else {
                        itemsString += item.market_hash_name + "!END!";
                    }
                });
                if (checker){
                request.post({
                  url: 'https://bitskins.com/api/v1/get_item_price',
                  form: {
                    'api_key': API_KEY,
                    'names': itemsString,
                    'delimiter': '!END!',
                    'code': totp.now()
                  }
                }, callback);
                function callback(error, response, body) {
                  if (!error) {
                    var info = JSON.parse(body);
                    if (info.status != "fail"){
                        var newItems = info.data.prices;
                        var totalPrice = 0;      
                        newItems.forEach(function(newItem,i,arr){
                             newItem.url = items[i].icon_url_large;
                             totalPrice += parseFloat(newItem.price);
                        });
                        var deposit = new Object();
                        deposit.totalPrice = totalPrice;
                        deposit.steamId    = offer.partner.getSteam3RenderedID();
                        deposit.items      = newItems;
                        //ToDo:
                        //1)Don't forget deposit.totalPrice!
                        //2)Accept offer and use object deposit
                    }
                    else offer.decline(function(err){
                        if (err) console.log(err);
                    });
                  }
                }
                }
                else {
                    offer.decline(function(err){
                        if (err) console.log(err);
                    });
                }
            }
        }
    });
});

function checkConfirmations(steamcommunityMobileConfirmations){
    steamcommunityMobileConfirmations.FetchConfirmations((function (err, confirmations)
        {
            if (err)
            {
                console.log(err);
                return;
            }
            console.log('steamcommunityMobileConfirmations.FetchConfirmations received ' + confirmations.length + ' confirmations');
            if ( ! confirmations.length)
            {
                return;
            }
            steamcommunityMobileConfirmations.AcceptConfirmation(confirmations[0], (function (err, result)
            {
                if (err)
                {
                    console.log(err);
                    return;
                }
                console.log('steamcommunityMobileConfirmations.AcceptConfirmation result: ' + result);
            }).bind(this));
        }).bind(this));
}
