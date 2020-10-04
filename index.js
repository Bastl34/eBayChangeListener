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
			let fromLessQuerys = false;

			//loop over all items
			$("#srp-river-results ul").children().each(function(i, elem)
			{
				const htmlContent = $(this).html();

				if (htmlContent.includes('international'))
					fromInternationalResults = true;

				if (htmlContent.includes('weniger Suchbegriffe') || htmlContent.includes('fewer words'))
					fromLessQuerys = true;

				if (search.filterInternationalResults && fromInternationalResults)
					return;

				if (fromLessQuerys)
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
				const match = htmlContent.match(/\/([0-9]{5,20})/);

				if (!match)
					return;

				item.id = match[1];

				//name and link
				item.name = $(this).find("a h3").text().replace("Neues Angebot","").replace("New listing","").trim();
				item.link = $(this).find(".s-item__info a").attr('href');

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
				item.image = $(this).find(".s-item__image-wrapper img").attr('src');

				//price
				item.price = ""+$(this).find(".s-item__price").text().trim();

				//format
				//bids or by it now
				item.priceFormat = $(this).find(".s-item__bids").text().replace("oder","").replace("or","").trim();
				if (!item.priceFormat)
					item.priceFormat = $(this).find(".s-item__purchase-options-with-icon").text().replace("oder","").replace("or","").trim();

				//shipping
				item.shipping = $(this).find(".s-item__shipping").text().trim();

				//pickup only
				if (item.shipping.trim())
					item.pickupOnly = false;
				else
					item.pickupOnly = true;

				if (search.filterPickupOnly && item.pickupOnly)
					return;

				items.timestamp = Date.now();

				items.push(item);
			});

			//check if something is new
			let newItems = getNewElements(lastItems[search.id], items);

			if (Object.keys(lastItems[search.id]).length > 0 && newItems.length > 0)
				notify(newItems,search.name, search.mailTo);

			//save last items
			items.forEach((item) =>
			{
				if (!(item.id in lastItems[search.id]))
					console.log(item.name);

				lastItems[search.id][item.id] = true;
			});
		}
		else
			console.log(error);
	});
}

function getNewElements(oldList,newList)
{
	if (newList.length == 0)
		return [];

	if (oldList.length == 0 && newList.length > 0)
		return newList;

	let newItems = [];
	newList.forEach((newElem) =>
	{
		if (!(newElem.id in oldList))
			newItems.push(newElem)
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