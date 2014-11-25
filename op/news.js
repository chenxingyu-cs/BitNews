var Node =  require('n2n').Node;

var node =  new Node(4321);
node.connect([{ host: '223.3.83.166', port :6785 }])
node.newsID = ''; //新闻ID
node.newsTitle = ''; //新闻标题
node.newsContent = ''; //新闻内容
node.newsClass = ''; //新闻类别
node.newsPublisherID = ''; //发布新闻人ID
node.newsTime = ''; //发布新闻时间
node.zan = 0; //新闻的顶
node.cai = 0; //新闻的踩

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./test.db');
//db.serialize(function() {
//	db.run("CREATE TABLE NEWS_INFO (newsID TEXT, title TEXT, content TEXT, class TEXT, publisherID TEXT, time INTEGER, zan INTEGER, cai INTEGER);");
//});

node.on('online', function () {
	console.log('I am online:', this.id);
});
node.on('node::online', function (newNode) {
    console.log('Someone is online:', newNode.id);
    var newsNum = 0;
    db.each("SELECT count(newsID) AS CNT FROM NEWS_INFO", function(err, row) {
    	console.log('the num in the database is ' + row.CNT);
    	newsNum = row.CNT;
  	});
  	var newsLocal = new Array();
    var newsCount = 0;
 	db.each("SELECT newsID as nID, title as newsTitle, content as newsContent, class as newsClass, publisherID as pID, time as t, zan, cai FROM NEWS_INFO", function(err, row) {
    	newsLocal[newsCount] = new Object();
    	console.log('the id in the database is ' + row.c + '  ' + row.b);
    	newsLocal[newsCount].newsID = row.nID;
    	newsLocal[newsCount].newsTitle = row.newsTitle;
    	newsLocal[newsCount].newsContent = row.newsContent;
    	newsLocal[newsCount].newsClass = row.newsClass;
    	newsLocal[newsCount].newsPublisherID = row.pID;
    	newsLocal[newsCount].newsTime = row.t;
    	newsLocal[newsCount].zan = row.zan;
    	newsLocal[newsCount].cai = row.cai;
    	newsCount++;
  	});
    node.send(newNode.id, 'hello');
    node.send(newNode.id, 'shouhuo', newsLocal);
});
node.on('node::hello', function (sender) {
	console.log('Hello from', sender);
//});

function publishNews( title, content, nClass )
{
	node.newsTitle = 'A';
	node.newsContent = 'aaa';
	node.newsClass = "ccc";
	node.emit('publish');
});

node.on('publish', function( news ) {
	console.log('Preparing to publish news:', this.id);
	node.newsPublisherID = this.id;

	var news = new Object();
	news.newsTitle = node.newsTitle;
	news.newsContent = node.newsContent;
	news.newsClass = node.newsClass;
	news.newsPublisherID = node.newsPublisherID;
	news.zan = 0;
	news.cai = 0;

	var now= new Date();
	news.newsTime = now.getTime();
	var createHash = require('crypto').createHash;
	var md5 = createHash('md5');
	var str = news.newsTitle + news.newsTime.toString();
	md5.update( str );
	news.newsID = md5.digest( "hex" );

	node.broadcast('publishNews', news);
});

node.on('node::publishNews', function(sender, news){
	console.log('Getting the published news:', news.newsPublisherID);
	node.newsID = news.newsID;
	node.newsTitle = news.newsTitle;
	node.newsContent = news.newsContent;
	node.newsClass = news.newsClass;
	node.newsPublisherID = news.newsPublisherID;
	node.zan = news.zan;
	node.cai = news.cai;
	node.newsTime = news.newsTime;
	
	
	db.run("INSERT INTO NEWS_INFO (newsID, title, content, class, publisherID, time, zan, cai ) VALUES ( '" + node.newsID + "', '"
		+ node.newsTitle + "', '" + node.newsContent + "', '" + node.newsClass + "', '" + node.newsPublisherID + "', " + node.newsTime + ", " +  node.zan + ", " + node.cai + ")");
	db.close();
});

