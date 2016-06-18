var SteamUser = require('steam-user');
var TradeOfferManager = require('steam-tradeoffer-manager');
var SteamTotp = require('steam-totp');
var SteamConfirm = require('steamcommunity-mobile-confirmations');
var request = require('request');

var Bot = function(accountName, password, sharedSecret, identitySecret, steamId) {
	this.accountName    = accountName;
	this.password       = password;
	this.sharedSecret   = sharedSecret;
	this.identitySecret = identitySecret;
	this.steamId        = steamId;

	this.deviceId = SteamTotp.getDeviceID(steamId);

	this.details = {
		"accountName"   : accountName,
		"password"      : password,
		"twoFactorCode" : ""
	};

	this.client = new SteamUser();

	this.manager = new TradeOfferManager({
	    "steam"        : this.client,
	    "domain"       : "localhost",
	    "language"     : "en",
        "pollInterval" : 1000 
	}); 

	//Other settings
	this.maxItemsAmount;
	this.minItemsCost; // cents!
};

Bot.prototype.autoRefreshCookies = function(interval) {
	setInterval(function() {
		this.client.webLogOn();
	}, interval);
};

Bot.prototype.confirmTrade = function() {
	this.steamcommunityMobileConfirmations.FetchConfirmations(function (err, confirmations)
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
    }.bind(this));
}

Bot.prototype.logOn = function() {
 	//Checking  required settings

        if (this.maxItemsAmount === undefined) this.maxItemsAmount = 10; //some default value
        if (this.minItemsCost   === undefined) this.minItemsCost   = 50; //some default value

	//End
	
	this.details.twoFactorCode = SteamTotp.generateAuthCode(this.sharedSecret);
	this.client.logOn(this.details); //logging in Steam

	/*
	  Defining events listeners
	*/
	this.client.on('loggedOn', function(details){
    	console.log("Bot is online.");
	});

    var self = this;
	this.client.on('webSession', function(sessionID, cookies){
        self.manager.setCookies(cookies, function(err) {
        if(err) {
            console.log(err);
            process.exit(1); // Fatal error since we couldn't get our API key
            return;
        }
        console.log("Got API key: " + self.manager.apiKey);
        var SteamcommunityMobileConfirmations = require('steamcommunity-mobile-confirmations');
        self.steamcommunityMobileConfirmations = new SteamcommunityMobileConfirmations(
        {
            steamid         : self.steamId,
            identity_secret : self.identitySecret,
            device_id       : self.deviceId,
            webCookie       : cookies,
        });
        }); 
	});
};

Bot.prototype.getPrice = function(name) {
    var res = false;
    for (var key in this.items_lib) {
        //return cost in cents
        if (key == name) {res = true; return this.items_lib[key] * 100; } 
    }
    if (!res) return 0;
}

Bot.prototype.listenOffers = function() {
    var self = this;

    //Listen to the new offers and start to processing it
    this.manager.on("newOffer", function(offer) {
        console.log("New offer!");
        self.newOffer(offer);
    });

    this.manager.on("receivedOfferChanged", function(offer) {
        //When offer was accepted we should calculate 
        //prices one more time, get user's info
        //(like username, profile image etc)
        //and do something then.
        if (offer.state != 3) return;

        var items     = [];
        var totalCost = 0; 
        offer.itemsToReceive.forEach(function(item, i, arr) {
            var obj   = new Object();
            obj.name  = item.market_hash_name;
            obj.price = getPrice(obj.name);
            item.icon_url_large ? 
                obj.image = item.icon_url_large :
                obj.image = item.getImageURL(); 
            totalCost += obj.price;
            items.push(obj);
            //Get user's info then. 
        });
        console.log(items);
    });
}

//Declaring flow control
Bot.prototype.newOffer = function(offer) {
    this.checkEscrowDuration(offer);
}

Bot.prototype.checkEscrowDuration = function(offer) {
    var next = this.checkOfferItems;

    offer.getEscrowDuration(function(err, daysTheirEscrow, daysMyEscrow) {
        if (err) throw new Error("Can't get Escrow Duration");
        if (daysTheirEscrow == 0) next(offer);
    }.bind(this));
}

Bot.prototype.checkOfferItems = function(offer) {
    var check       = false;
    var items       = [];
    var totalCost   = 0;

    if (offer.itemsToGive.length != 0) { offer.decline(); return; }

    offer.itemsToReceive.forEach(function(item, i, arr) {
        if (item.appid == 730 && item.market_hash_name.indexOf("Souvenir") == -1) {
            var obj = new Object();
            obj.name  = item.market_hash_name;
            obj.price = getPrice(obj.name);
            totalCost += obj.price;
            items.push(obj); 
        } else check = true;
    });

    if (check) { offer.decline(); return; }
    if (offer.itemsToReceive.length > this.maxItemsAmount) { offer.decline(); return; }
    if (totalCost < this.minItemsCost) { offer.decline(); return; }
    offer.accept();
}
