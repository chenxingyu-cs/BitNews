var Node =  require('n2n').Node;

var node =  new Node(4321);
node.connect([{ host: '223.3.89.118', port :6785 }])
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

db.each("SELECT COUNT(*) as CNT FROM sqlite_master where type='table' and name='NEWS_INFO'", function(err, row) {
	console.log('whether has a table is:' + row.CNT);
	if(row.CNT == 0)
		db.serialize(function() {
		    db.run("CREATE TABLE NEWS_INFO (newsID TEXT, title TEXT, content TEXT, class TEXT, publisherID TEXT, time INTEGER, zan INTEGER, cai INTEGER);");
		});

});

node.on('online', function () {
	console.log('I am online:', this.id);
});

node.on('node::online', function (newNode) {
    console.log('Someone is online:', newNode.id);

 	db.each("SELECT newsID as nID, title as newsTitle, content as newsContent, class as newsClass, publisherID as pID, time as t, zan, cai FROM NEWS_INFO", function(err, row) {
    	var oneNews = new Object();
    	console.log('the id in the database is ' + row.nID + ' \n and title is ' + row.newsTitle);
    	oneNews.newsID = row.nID;
    	oneNews.newsTitle = row.newsTitle;
    	oneNews.newsContent = row.newsContent;
    	oneNews.newsClass = row.newsClass;
    	oneNews.newsPublisherID = row.pID;
    	oneNews.newsTime = row.t;
    	oneNews.zan = row.zan;
    	oneNews.cai = row.cai;
    	console.log(oneNews);
    	node.send(newNode.id, 'getNewsWhenOnline', oneNews);
  	});
    node.send(newNode.id, 'hello');
    
});

node.on('node::hello', function (sender) {
	console.log('Hello from', sender);
});

function publishNews( title, content, nClass )
{
	node.newsTitle = 'A';                       //这里需要改！！！
	node.newsContent = 'aaa';
	node.newsClass = "ccc";
	node.emit('publish');
};

node.on('node::getNewsWhenOnline', function (sender, oneNews) {
	console.log(oneNews);
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database('./test.db');
	
	db.each("SELECT COUNT(*) as CNT FROM sqlite_master where type='table' and name='NEWS_INFO'", function(err, row) {
		console.log('whether has a table is:' + row.CNT);
		if(row.CNT == 0)
		db.serialize(function() {
		    db.run("CREATE TABLE NEWS_INFO (newsID TEXT, title TEXT, content TEXT, class TEXT, publisherID TEXT, time INTEGER, zan INTEGER, cai INTEGER);");
		});

	});
	
	db.each("SELECT COUNT(*) as newscnt FROM NEWS_INFO where newsID = '" + oneNews.newsID + "'", function(err, row) {
		if(row.CNT == 0)
		db.run("INSERT INTO NEWS_INFO (newsID, title, content, class, publisherID, time, zan, cai ) VALUES ( '" +oneNews.newsID + "', '"
		+ oneNews.newsTitle + "', '" + oneNews.newsContent + "', '" + oneNews.newsClass + "', '" + oneNews.newsPublisherID + "', " + oneNews.newsTime + ", " +  oneNews.zan + ", " +oneNews.cai + ")");

	});

	db.close();
	
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

