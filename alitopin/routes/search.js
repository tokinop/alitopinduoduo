var express = require('express');
var router = express.Router();
const parseDomain = require("parse-domain");
const cheerio = require('cheerio');
const rp = require('request-promise');
const iconv = require('iconv-lite');
const urlEnode = require('urlencode');
const unescapeJs = require('unescape-js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('search/index', {
        title: '搜索产品'
    });
});

router.get('/searchAliByKey', function (req, res, next) {
    res.render('search/searchAliByKey');
});

router.post('/searchAliByKey',async function (req, res, next) {
    let key = req.body.key;
    if (!key) return next();
    key = urlEnode.encode(key, 'gbk');
    let items=await processAliByKey(key);
    res.render('search/itemList', {
        title: '产品列表',
        items: items
    });
});

router.post('/', async function (req, res, next) {
    let url = req.body.url;
    if (!url) return next();
    let domain = parseDomain(url);
    if (!domain) return next();
    if (domain.domain == '1688' && domain.tld == 'com' && domain.subdomain == 's') {
        let items = await processAli(url);
        res.render('search/itemList', {
            title: '产品列表',
            url: url,
            items: items
        });
    } else {
        next();
    }
});


async function processAli(url) {
    let options = {
        encoding: null,
        uri: url,
        transform: function (body) {
            return cheerio.load(iconv.decode(body, 'gbk'));
        }
    };
    try {
        let $ = await rp(options);
        let itemNodes = $('ul#sm-offer-list>li>div>div>a.sm-offer-photoLink.sw-dpl-offer-photoLink');
        let items = [];
        itemNodes.each(function (i, element) {
            let item = {};
            item.title = element.attribs.title;
            item.url = element.attribs.href;
            items.push(item);
        });
        // console.log(items);
        return items;
    } catch (error) {
        throw error;
    }
}

async function processAliByKey(key) {
    let options = {
        encoding: null,
        uri: `https://s.1688.com/daixiao/rpc_async_render.jsonp?keywords=${key}&n=y&buyerProtection=essxsfh&filt=y&qrwRedirectEnabled=false&uniqfield=pic_tag_id&beginPage=1&templateConfigName=daixiaoOfferresult&offset=0&pageSize=60&asyncCount=60&startIndex=0&async=true&enableAsync=true&rpcflag=new&_pageName_=%B4%FA%CF%FA%CB%D1%CB%F7&requestId=1258418016001583431970317000554&callback=jQuery1720936899361631119_1583431635808`,
        transform: function (body) {
            // let removeStr='jQuery1720936899361631119_1583431635808(';
            body = iconv.decode(body, 'gbk');
            // body=body.substring(0,body.length-1);
            // body=body.substring(40,body.length-1);
            // body=body.replace(new RegExp(removeStr), "");
            return body;
        }
    };
    try {
        let jsonStr = await rp(options);
        jsonStr = unescapeJs(jsonStr);
        jsonStr = jsonStr.replace(/\\/g, '');
        let htmlStart = jsonStr.indexOf('"html":"') + 8;
        let htmlEnd = jsonStr.indexOf('"beaconP4Pid"') - 9;
        let htmlStr = jsonStr.substring(htmlStart, htmlEnd)
        let $ = cheerio.load(htmlStr);
        let itemNodes = $('a.sm-offer-photoLink.sw-dpl-offer-photoLink');
        console.log(itemNodes.length);
        let items = [];
        itemNodes.each(function (i, element) {
            let item = {};
            item.title = element.attribs.title;
            item.url = element.attribs.href;
            items.push(item);
        });
        console.log(items);
        return items;
    } catch (error) {
        throw error;
    }
}
module.exports = router;