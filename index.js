'use strict';

//packages
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

//config
const config = require('./config');
const userConfig = require('./config.user');

//mail
let mailTransporter = nodemailer.createTransport(`smtps://${encodeURIComponent(userConfig.mail.user)}:${encodeURIComponent(userConfig.mail.pass)}@${userConfig.mail.host}`);

//exception
process.on('uncaughtException', function (err) {
    console.error(err);
	process.exit(1);
    //console.log("Node NOT Exiting...");
    //callback(true,null);
  });

//vars
let lastItems = [];

console.log("looking for new search entries...");

setInterval(()=>
{
	doRequest();
},config.timerInterval);
doRequest();


function doRequest()
{
	request(userConfig.searchUrl, function (error, response, body)
	{
		if (!error && response.statusCode == 200)
		{
			let $ = cheerio.load(body);

			let items = [];
			
			//loop over all items
			$("#ListViewInner").children("li").each(function(i, elem) {

				let item = {
					id: "",
					name: "",
					image: "",
					link: "",
					price: "",
					priceFormat: "",
					shipping: "",
					time: ""
				};

				//id
				item.id = $(this).attr("id");

				//name and link			
				$(this).find(".lvtitle").find("a").each(function(i, link)
				{
					item.name = $(link).text().replace("Neues Angebot","").replace("New listing","").trim();
					item.link = $(link).attr('href');
				});

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

				//shipping
				item.shipping = $(this).find(".lvshipping span span span").text().trim();
				if (item.shipping == "")
					item.shipping = $(this).find(".lvshipping span span").text().trim();

				items.push(item);
			});

			//check if something is new
			let newItems = getNewElements(lastItems,items,"id");

			if (lastItems.length > 0 && newItems.length > 0)
				notify(newItems);

			//save last items
			lastItems = items;

		}
		else
			console.log(error);
	});
}

function getNewElements(oldList,newList,compareKey)
{
	if (!oldList || oldList.length == 0)
		return newList;

	if(!newList || newList.length == 0)
		return [];
	
	let newItems = [];

	newList.forEach((newElem) =>
	{
		let found = false;

		oldList.forEach((oldElem) =>
		{
			if(newElem[compareKey] == oldElem[compareKey])
				found = true;
		});

		if (!found)
			newItems.push(newElem);
	});

	return newItems;
}

function notify(newItems)
{

	newItems.forEach((item) =>
	{
		console.log("("+(new Date())+") new item: "+item.name);
	});

	let mail = createMail(newItems);
	sendMail("New Search Items",mail);
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

function sendMail(subject,msg,callback)
{
	let mail =  Object.assign({ subject:subject, html: msg }, { from: userConfig.mail.from, to: userConfig.mail.to });
	mailTransporter.sendMail(mail, function(error, info) {
		if(error) {
			console.warn('could not send eMail',"eMail",error);
		} else {
			console.log('eMail sent: ' + info.response);
		}

		if (callback)
			callback(error);
	});
}

/*
let test = [{ id: 'item43f7b65dfc',
  image: 'http://thumbs.ebaystatic.com/images/g/98MAAOSwLF1YBWG2/s-l225.jpg',
  name: 'Apple iPhone 5S 64GB Black - Verizon AT&T T-Mobile Unlocked GSM 7102764',
  link: 'http://www.ebay.com/itm/Apple-iPhone-5S-64GB-Black-Verizon-AT-T-T-Mobile-Unlocked-GSM-7102764-/291918732796?hash=item43f7b65dfc:g:~pYAAOSwB09YCp~p',  price: '$257.00$699.99',
  priceFormat: 'Buy It Now',
  shipping: '',
  time: 'Oct-21 16:08' },{ id: 'item43f7b65dfc',
  image: 'http://thumbs.ebaystatic.com/images/g/98MAAOSwLF1YBWG2/s-l225.jpg',
  name: 'Apple iPhone 5S 64GB Black - Verizon AT&T T-Mobile Unlocked GSM 7102764',
  link: 'http://www.ebay.com/itm/Apple-iPhone-5S-64GB-Black-Verizon-AT-T-T-Mobile-Unlocked-GSM-7102764-/291918732796?hash=item43f7b65dfc:g:~pYAAOSwB09YCp~p',  price: '$257.00$699.99',
  priceFormat: 'Buy It Now',
  shipping: '',
  time: 'Oct-21 16:08' }];

let mailItem = createMail(test);

console.log(mailItem);
*/
//sendMail("test","test test");