'use strict';

//packages
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const moment = require('moment');

//config
const config = require('./config');
const userConfig = require('./config.user');

//set moment locale
moment.locale(userConfig.locale);

//mail
let mailTransporter = nodemailer.createTransport(`smtps://${encodeURIComponent(userConfig.mail.user)}:${encodeURIComponent(userConfig.mail.pass)}@${userConfig.mail.host}`);

//exception
process.on('uncaughtException', function (err)
{
    console.error(err);
	process.exit(1);
});

//vars
let lastItems = {};

console.log("looking for new search entries...");

for(let i=0;i<userConfig.searchs.length;++i)
{
	let search = userConfig.searchs[i];
	search.id = i;

	console.log("looking for: "+search.name);

	lastItems[search.id] = {};

	setInterval(()=>
	{
		doRequest(search);
	},config.timerInterval);
	doRequest(search);
}

function doRequest(search)
{
	request(search.url, function (error, response, body)
	{
		if (!error && response.statusCode == 200)
		{
			let $ = cheerio.load(body);

			let items = [];
			
			let fromInternationalResults = false;
			
			//loop over all items
			$("#ListViewInner").children("li").each(function(i, elem)
			{
				if (!$(this).hasClass("sresult"))
					fromInternationalResults = true;
								
				if (search.filterInternationalResults && fromInternationalResults)
					return;

				let item =
				{
					id: "",
					name: "",
					image: "",
					link: "",
					price: "",
					priceFormat: "",
					shipping: "",
					pickupOnly: false,
					time: "",
					timestamp: 0
				};

				//id
				item.id = $(this).attr("id");

				//name and link			
				$(this).find(".lvtitle").find("a").each(function(i, link)
				{
					item.name = $(link).text().replace("Neues Angebot","").replace("New listing","").trim();
					item.link = $(link).attr('href');
				});

				//additional filter
				if (search.additionalFilter)
				{
					let filters = search.additionalFilter.split(" ");
					let found = false;

					filters.forEach((filter) =>
					{
						filter = filter.toLowerCase();
						let title = item.name.toLowerCase();

						if (title.indexOf(filter) != -1)
							found = true;
					});

					if (found)
						return;
				}

				//image
				item.image = $(this).find(".lvpicinner img").attr('imgurl');
				if (!item.image)
					item.image = $(this).find(".lvpicinner img").attr('src');

				//price
				item.price = ""+$(this).find(".lvprice span").text().trim().replace(/(EUR)/,"$1");

				const regex = /(.*?)\n/;
				let m;

				if ((m = regex.exec(item.price)) !== null)
					item.price = m[1];

				//format
				item.priceFormat = $(this).find(".lvformat span").text().replace("oder","").replace("or","").trim();

				//time
				item.time = $(this).find(".timeleft span span").text().trim();

				if (userConfig.locale == "de")
					item.time = item.time.replace("Sep","Sept").replace("Feb","Febr")
				
				item.timestamp = moment(item.time, userConfig.dateFormat).valueOf();

				//shipping
				item.shipping = $(this).find(".lvshipping span span span").text().trim();
				if (item.shipping == "")
					item.shipping = $(this).find(".lvshipping span span").text().trim();

				//pickup only
				let pickup = $(this).find(".lvshipping span").text().trim().toLowerCase();
				if (pickup.indexOf("nur abholung") == -1 && pickup.indexOf("pickup") == -1)
					item.pickupOnly = false;
				else
					item.pickupOnly = true;

				if (search.filterPickupOnly && item.pickupOnly)
					return;

				items.push(item);
			});

			//check if something is new
			let newItems = getNewElements(lastItems[search.id],items,"id");

			if (Object.keys(lastItems[search.id]).length > 0 && newItems.length > 0)
				notify(newItems,search.name, search.mailTo);

			//save last items
			items.forEach((item) =>
			{
				lastItems[search.id][item.id] = item;
			});
		}
		else
			console.log(error);
	});
}

function getNewElements(oldList,newList,compareKey)
{

	if (!oldList || Object.keys(oldList).length == 0)
		return newList;

	if(!newList || newList.length == 0)
		return [];
	
	let newItems = [];

	newList.forEach((newElem) =>
	{
		//check if item already added to list
		let isInList = (newElem.id in oldList);

		//check if entry is to old
		let toOld = false;
		let now = new Date().getTime();
		if (config.ignoreInterval > 0 && newElem.timestamp <= now - config.ignoreInterval)
			toOld = true;

		if (!isInList && !toOld)
			newItems.push(newElem);
	});

	return newItems;
}

function notify(newItems, name, mailTo)
{
	newItems.forEach((item) =>
	{
		console.log("("+(new Date())+") new item: "+item.name);
	});

	let mail = createMail(newItems);
	if (name)
		sendMail("New Search Items for "+name, mail, mailTo);
	else
		sendMail("New Search Items", mail, mailTo);
}

function createMail(items)
{
	let content = "";

	let mailOuter = `
<html>
    <head />
    <body style="font-family:verdana, sans-serif;">
		INNER
    </body>
</html>
	`;

	let mailInner = `
		<a href="LINK" style="color: inherit;">
			<div style="clear: both;padding:0.5em;background-color:COLOR;height:12em">
				<div style="float:left;margin-right:0.5em;width:125px;height:100%;background-image:url(IMG);background-size:contain;background-repeat: no-repeat;background-position: 50% 50%;">
				</div>
				<div>
					<h3>NAME</h3>
					<h4>PRICE</h4>
					<div>
						PRICEFORMAT (SHIPPING)<br>
						DATE
					</div>
				</div>
			</div>
		</a>
	`;

	let innerContent = "";


	for(let i=0;i<items.length;++i)
	{
		let item = items[i];

		let entry = mailInner;
		entry = entry.replace("IMG",item.image);
		entry = entry.replace("LINK",item.link);
		entry = entry.replace("COLOR",(i%2 == 0)?"#eff7ff":"#e3f1fd");
		entry = entry.replace("NAME",item.name);
		entry = entry.replace("PRICE",item.price);
		entry = entry.replace("PRICEFORMAT",item.priceFormat);
		entry = entry.replace("SHIPPING",item.shipping);
		entry = entry.replace("DATE",item.time);

		innerContent += entry;
	}

	return mailOuter.replace("INNER",innerContent);
}

function sendMail(subject, msg, mailTo, callback)
{
	let mail = Object.assign({ subject:subject, html: msg }, { from: userConfig.mail.from, to: mailTo ? mailTo : userConfig.mail.to });
	mailTransporter.sendMail(mail, function(error, info)
	{
		if(error)
			console.warn('could not send eMail',"eMail",error);
		else
			console.log('eMail sent: ' + info.response);

		if (callback)
			callback(error);
	});
}