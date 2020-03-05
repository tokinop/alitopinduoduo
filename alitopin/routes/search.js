var express = require('express');
var router = express.Router();
const parseDomain = require("parse-domain");
const cheerio = require('cheerio');
const rp = require('request-promise');
const iconv = require('iconv-lite');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('search/index', {
        title: '搜索产品'
    });
});

router.post('/', async function (req, res, next) {
    let url = req.body.url;
    if (!url) return next();
    let domain = parseDomain(url);
    if (!domain) return next();
    if (domain.domain == '1688' && domain.tld == 'com' && domain.subdomain == 's') {
        let items=await processAli(url);
        res.render('search/itemList', {
            title: '产品列表',
            url: url,
            items:items
        });
    }else{
        next();
    }
});


async function processAli(url) {
    let options = {
        encoding: null,
        uri: url,
        transform: function (body) {
            return cheerio.load(iconv.decode(body,'gbk'));
        }
    };
    try {
        let $= await rp(options);
        let itemNodes = $('ul#sm-offer-list>li>div>div>a.sm-offer-photoLink.sw-dpl-offer-photoLink');
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