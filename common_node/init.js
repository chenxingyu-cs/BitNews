
var Node = require('n2n').Node;

var node = new Node(4321);

exports.init =function (window)
{
	node.connect([{ host: '23.244.180.114', port: 6785 }]);
	node.answers=[]//存放正确答案
	node.corrects=[]//存放正确个数
	node.ops=[]//存放操作，顶还是踩
	node.problems=[]//存放题目
	node.news_ids=[]//存放新闻id
	node.authors=[]//存放出题者id
	node.newsAuthors=[]//存放新闻发送者id
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
		console.log("error point1: " + err);
		console.log("cnt is: "+row.CNT);
		if(row.CNT == 0){
    		db.run("CREATE TABLE NEWS_INFO (newsID TEXT PRIMARY KEY, title TEXT, content TEXT, class TEXT, publisherID TEXT, time INTEGER, zan INTEGER, cai INTEGER);");
			console.log("establish database");
		}
	});

	

	function completeOperation(voter)
	{
		if(node.corrects[voter]>3)
		{
			if(node.ops[voter]==1)
			{
				var requiredNewsID = node.news_ids[voter];//该id上升一位
				db.run("UPDATE NEWS_INFO SET zan = (SELECT zan+1 FROM NEWS_INFO WHERE newsID = '" + requiredNewsID +"' ) WHERE newsID = '" + requiredNewsID +"'");
			}
			else
			{
				var requiredNewsID = node.news_ids[voter];//该id上升一位
				db.run("UPDATE NEWS_INFO SET cai = (SELECT cai+1 FROM NEWS_INFO WHERE newsID = '" + requiredNewsID +"' ) WHERE newsID = '" + requiredNewsID +"'");
			}
		}
		
	}
	function createAuthor(sender)
	{
		node.authors[sender]=new Array();
		var i;
		for(i=0;i<node.sortedIds.length;i++)
			if(node.sortedIds[i]==sender)
				break;
		var j=0;
		while(1)
		{
			i=(i+1)%node.sortedIds.length;
			if(node.sortedIds[i]==sender)
				break;
			else if(j>5)
				break;
			else
			{
				j++;
				node.authors[sender].push(node.sortedIds[i]);
				console.log("create_author:",node.sortedIds[i]);
			}
		}
	}
	function createNewsAuthor(sender)
	{
		node.newsAuthors[sender]=new Array();
		var i;
		for(i=0;i<node.sortedIds.length;i++)
			if(node.sortedIds[i]==sender)
				break;
		var j=0;
		while(1)
		{
			i=(i+1)%node.sortedIds.length;
			if(node.sortedIds[i]==sender)
				break;
			else if(j>5)
				break;
			else
			{
				j++;
				node.newsAuthors[sender].push(node.sortedIds[i]);
				console.log("create_author:",node.sortedIds[i]);
			}
		}
	}
	node.on('online', function () {
		console.log('I am online:', this.id);
		createNewsAuthor(node.id);
		node.broadcast('getData');
	});
	node.on('node::getData', function (sender) {
		console.log('Someone wants to getData:', sender);
		if(sender!=node.id)
		{
			createNewsAuthor(sender);
			for(var i=0;i<node.newsAuthors[sender].length;i++)//如果出题人包含自己，则需要出题
			{
				if(node.id==node.newsAuthors[sender][i])
				{
					//从数据获取数据
					
	/*				var sqlite3 = require('sqlite3').verbose();
					var db = new sqlite3.Database('./test.db');

					db.each("SELECT COUNT(*) as CNT FROM sqlite_master where type='table' and name='NEWS_INFO'", function(err, row) {
						if(row.CNT == 0)
							db.serialize(function() {
								db.run("CREATE TABLE NEWS_INFO (newsID TEXT, title TEXT, content TEXT, class TEXT, publisherID TEXT, time INTEGER, zan INTEGER, cai INTEGER);");
								console.log("establish database when aaaaa");
							});

					});
	**/				db.each("SELECT newsID as nID, title as newsTitle, content as newsContent, class as newsClass, publisherID as pID, time as t, zan, cai FROM NEWS_INFO", function(err, row) {
						console.log(err);
						if(!err){
							//console.log("The database local has data and preparing to send");
							var oneNews = new Object();
							oneNews.newsID = row.nID;
							oneNews.newsTitle = row.newsTitle;
							oneNews.newsContent = row.newsContent;
							oneNews.newsClass = row.newsClass;
							oneNews.newsPublisherID = row.pID;
							oneNews.newsTime = row.t;
							oneNews.zan = row.zan;
							oneNews.cai = row.cai;
							node.send(sender,'returnData', oneNews);
						}else
						console.log("The database local does not have data and refuse to send");
						
					});
					console.log('Sending news stored to ', sender);
					
					break;
				}
			}
		}
	});

	process.on('uncaughtException', function(err) {
	  console.log('Caught exception: ' + err);
	});

	node.on('node::returnData', function (sender,oneNews) {
		console.log('data from', sender);
		//将data写入数据库
		

		db.each("SELECT COUNT(*) as CNT FROM NEWS_INFO where newsID = '" + oneNews.newsID + "'", function(err, row) {
			console.log(err);
			if(!err && row.CNT == 0){
				db.run("INSERT INTO NEWS_INFO (newsID, title, content, class, publisherID, time, zan, cai ) VALUES ( '" +oneNews.newsID + "', '"
				+ oneNews.newsTitle + "', '" + oneNews.newsContent + "', '" + oneNews.newsClass + "', '" + oneNews.newsPublisherID + "', " + oneNews.newsTime + ", " +  oneNews.zan + ", " +oneNews.cai + ")");
				console.log('Saving news to database when online');
			}
		
		});
		
		

	});
   node.on('showNews', function(newsRequire){
		console.log('class is :' + newsRequire.newsClass);
		console.log('page num is :' + newsRequire.newsPageNum);
		console.log('sort is: ' + newsRequire.newsSort);
	//	window.document.getElementById('newsTitle').innerHTML="aaa";
		if( newsRequire.newsSort == 'Default'){
			var newsNum = 1;
			db.each("SELECT COUNT(*) as newscnt FROM NEWS_INFO", function(err, row) {
				console.log(err);
				//console.log(row.newscnt);
				if(!err && row.newscnt != 0){
					console.log("lalala");
					db.each("SELECT newsID as nID, title as newsTitle, content as newsContent, time as t, zan, cai FROM NEWS_INFO where class = '" 
						+ newsRequire.newsClass + "' ORDER BY (zan-cai) DESC limit " + (newsRequire.newsPageNum-1)*10 + ", 10" , function(err, row) {
							console.log(newsNum);
							console.log("id: " + row.nID);
							console.log("title: "+ row.newsTitle);
							console.log("content: "+ row.newsContent);
							console.log("time: "+ row.t);
							console.log("zan: " + row.zan);
							console.log("cai: " + row.cai);						

							window.document.getElementById('id' + newsNum).value= row.nID;   
		  					window.document.getElementById('newsTitle' + newsNum).innerHTML= row.newsTitle;
	   						window.document.getElementById('newsContent'+ newsNum).innerHTML= row.newsContent.toString().substr(0,120)+"...";
		   					window.document.getElementById('scores'+ newsNum).innerHTML= (row.zan-row.cai) ;
		   					newsNum ++ ;
					});
				}
			});
		}else if (newsRequire.newsSort == 'Latest'){
			var newsNum = 1;
			db.each("SELECT COUNT(*) as newscnt FROM NEWS_INFO", function(err, row) {
				console.log(err);
				console.log(row.newscnt);
				if(row.newscnt != 0&&!err){
					console.log("lalala");
					db.each("SELECT newsID as nID, title as newsTitle, content as newsContent, time as t, zan, cai FROM NEWS_INFO where class = '" 
						+ newsRequire.newsClass + "' ORDER BY time DESC limit " + (newsRequire.newsPageNum-1)*10 + ", 10" , function(err, row) {
							console.log(newsNum);
							console.log("id: " + row.nID);
							console.log("title: "+ row.newsTitle);
							console.log("content: "+ row.newsContent);
							console.log("time: "+ row.t);
							console.log("zan: " + row.zan);
							console.log("cai: " + row.cai);						

							window.document.getElementById('id' + newsNum).value= row.nID;   
		  					window.document.getElementById('newsTitle' + newsNum).innerHTML= row.newsTitle;
	   						window.document.getElementById('newsContent'+ newsNum).innerHTML= row.newsContent.toString().substr(0,120)+"...";
		   					window.document.getElementById('scores'+ newsNum).innerHTML= (row.zan-row.cai) ;
		   					newsNum ++ ;
					});
				}
			});
		}
	});

	node.on('showNewsByid', function(nID){
		console.log('required news id is :' + nID);		

//		var sqlite3 = require('sqlite3').verbose();
//		var db = new sqlite3.Database('./test.db');
		db.each("SELECT title as newsTitle, content as newsContent, time as t, zan, cai FROM NEWS_INFO where newsID = '" + nID + "' " , function(err, row) {
				console.log("title: "+ row.newsTitle);
				console.log("content: "+ row.newsContent);
				console.log("time: "+ row.t);
				console.log("zan: " + row.zan);
				console.log("cai: " + row.cai);
				var d = new Date(row.t);	
				console.log( d.toDateString());	
			   window.document.getElementById('newsTime1').innerHTML= d.toDateString(); //20 March 2014
			   window.document.getElementById('newsTime2').innerHTML= d.toLocaleTimeString();//08:34
			   window.document.getElementById('h1title').innerHTML= row.newsTitle;
			   window.document.getElementById('endText').innerHTML= row.newsContent;//
			   window.document.getElementById('newsSupp').innerHTML= row.zan;//
			   window.document.getElementById('newsOppo').innerHTML= row.cai;//
	   			
		});
					
	   	

	 
	});

	node.on('node::online', function (newNode) {
		console.log('Someone is online:', newNode.id);
		
		node.send(newNode.id, 'hello');
	});

	node.on('node::hello', function (sender) {
		console.log('Hello from', sender);
	});
	
	
	function genCaptcha () {
		
		var c=window.document.createElement("canvas");
		c.style.width = "130px";
		c.style.height = "60px";
		var ctx=c.getContext("2d");
		ctx.font="50pt Arial";
		var captcha="abcdefghjkmnpqrstuvwxyz23456789";
		var rand=captcha[Math.floor((Math.random()*captcha.length))]+captcha[Math.floor((Math.random()*captcha.length))]+captcha[Math.floor((Math.random()*captcha.length))]+captcha[Math.floor((Math.random()*captcha.length))];
		ctx.strokeText(rand,10,50);
		var dataURL=c.toDataURL();
		return {
			captchaValue: rand,
			captchaImgData: dataURL
		};
	}
	function disCaptcha (dataURL,sender) {
		for(var i=0;i<5;i++)
		{
			if(i>node.authors[node.id].length)
				return;
			if(sender==node.authors[node.id][i])
				break;
		}
		var captcha=window.document.getElementById("captcha"+(i+1));
		console.log(captcha);
		console.log("url",dataURL);
		console.log("sender",sender);
		captcha.src=dataURL;
		captcha.name=sender;
}

	//接收投票来源
	node.on('node::vote', function (sender,vote_info) {
		console.log('vote from', sender);
		node.corrects[sender]=0;
		node.ops[sender]=vote_info.op;
		node.news_ids[sender]=vote_info.news_id;
		if(sender!=node.id)
		{
			createAuthor(sender);
			for(var i=0;i<node.authors[sender].length;i++)//如果出题人包含自己，则需要出题
			{
				if(node.id==node.authors[sender][i])
				{
					var result=genCaptcha();
					node.answers[sender]=result.captchaValue;
					console.log(result);
					node.send(sender,'problem',result.captchaImgData);
					break;
				}
			}
		}
		
	});

/* 	node.on('node::getNewsWhenOnline', function (sender, oneNews) {
		

	
	}); */

	node.on('publish', function( news ) {
		console.log('Preparing to publish news:', this.id);
		console.log('Content is: ', news.newsContent);
		news.newsPublisherID = this.id;
		news.zan = 0;
		news.cai = 0;

		var now = new Date();
		news.newsTime = now.getTime();
		var createHash = require('crypto').createHash;
		var md5 = createHash('md5');
		var str = news.newsTitle + news.newsTime.toString();
		md5.update( str );
		news.newsID = md5.digest( "hex" );

		node.broadcast('publishNews', news);
	});

	node.on('node::publishNews', function(sender, news){
		var sqlite3 = require('sqlite3').verbose();
		var db = new sqlite3.Database('./test.db');
		console.log('Getting the published news:', news.newsPublisherID);
		node.newsID = news.newsID;
		node.newsTitle = news.newsTitle;
		node.newsContent = news.newsContent;
		node.newsClass = news.newsClass;
		node.newsPublisherID = news.newsPublisherID;
		node.zan = news.zan;
		node.cai = news.cai;
		node.newsTime = news.newsTime;
		
		db.each("SELECT COUNT(*) as newscnt FROM NEWS_INFO where newsID = '" + node.newsID + "'", function(err, row) {
			if(row.newscnt == 0){
				db.run("INSERT INTO NEWS_INFO (newsID, title, content, class, publisherID, time, zan, cai ) VALUES ( '" +node.newsID + "', '"
				+ node.newsTitle + "', '" + node.newsContent + "', '" + node.newsClass + "', '" + node.newsPublisherID + "', " + node.newsTime + ", " +  node.zan + ", " +node.cai + ")");
				console.log('Saving news to database when published');
			}
		});
		
	});

	node.on('node::problem', function (sender,problem) {
		console.log('problem from', sender);
		console.log(node.authors[node.id]);
		console.log(1);
		for(var i=0;i<node.authors[node.id].length;i++)
		{
			if(sender==node.authors[node.id][i])		
			{
				disCaptcha(problem,sender);
				console.log(3);
				node.problems[sender]=problem;
				break;
			}
		}
		console.log(2);
	});
	node.on('complete', function (answers) {
		console.log(answers);
		for(var i=0;i<answers.length;i++)
		{
			if(answers[i].id!="")
				node.send(answers[i].id,'verify',answers[i].answer);
		}
	});
	node.on('node::verify', function (sender,result) {
		console.log('verify from', sender);
		if(result==node.answers[sender])
			node.broadcast('right',sender);
	});

	node.on('node::right', function (sender,voter) {
		console.log('right from', sender);
		node.corrects[voter]++;
		if(node.corrects[voter]==4)
			completeOperation(voter);
	});
	node.on('node::offline', function (offline_id) {
		console.log('offline :', offline_id);
	});
	return function vote(news_id,op)
	{
		node.news_ids[node.id]=news_id;
		node.ops[node.id]=op;
		console.log('I am want to vote:', node.id);
		var vote_info=new Object();
		vote_info.op=node.ops[node.id];
		vote_info.news_id=node.news_ids[node.id];
		node.broadcast('vote',vote_info);
		createAuthor(node.id);
	}
}
exports.Node = node;
