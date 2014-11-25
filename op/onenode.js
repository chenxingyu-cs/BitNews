
var Node = require('../').Node;

var node = new Node(4321);

var ids=new Array()//存放所有id

var answers=new Array()//存放正确答案

var corrects=new Array()//存放正确个数

var ops=new Array()//存放操作，顶还是踩

var news_ids=new Array()//存放新闻id

var authors=new Array()//存放出题者id

var crypto = require('crypto');

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

node.connect([{ host: '223.3.74.23', port: 6785 }]);

node.on('online', function () {
	console.log('I am online:', this.id);
	ids.push(this.id);
});
//创建出题人
function createAuthor(sender)
{/* 
    var md5sum = crypto.createHash('md5');
    md5sum.update(sender);
    str = md5sum.digest('hex'); */
	authors[sender]=new Array();
	var i;
	for(i=0;i<ids.length;i++)
		if(ids[i]==sender)
			break;
	var j=0;
	while(1)
	{
		i=(i+1)%ids.length;
		if(ids[i]==sender)
			break;
		else if(j>10)
			break;
		else
		{
			j++;
			authors[sender].push(ids[i]);
			console.log("create_author:",ids[i]);
		}
	}
}
function completeOperation(voter)
{
    if(corrects[voter]>=8)
    {
        if(ops[voter]=='plus')
        {
            news_ids[voter];//该id上升一位
        }
        else
        {
            news_ids[voter];//该id下降一位
        }
    }
}
//点击投票，发出请求，发送vote事件
node.on('vote', function () {
	console.log('I am want to vote:', this.id);
    var vote_info=new Object();
    vote_info.op='plus';
    vote_info.news_id='0';
	node.broadcast('vote',vote_info);
});

//接收投票来源
node.on('node::vote', function (sender,vote_info) {
	console.log('vote from', sender);
    ids.sort();
    corrects[sender]=0;
    ops[sender]=vote_info.op;
    news_ids[sender]=vote_info.news_id;
    createAuthor(sender);
    for(var i=0;i<authors[sender].length;i++)//如果出题人包含自己，则需要出题
    {
        if(this.id==authors[sender][i])
        {
            rl.question("请出题? ", function(problem) {
			  // TODO: Log the answer in a database
			  console.log("你的题目是", problem);
			  node.send(sender, 'answer',problem);//发送问题去验证
			  answers[sender]=problem;//这里需要改成答案
			});
            break;
        }
    }
});


node.on('node::problem', function (sender,problem) {
    console.log('problem from', sender);
    for(var i=0;i<authors[this.id].length;i++)
    {
        if(sender==authors[this.id][i])//如果出题人在自己的列表中
        {
			rl.question("题目是:"+problem, function(answer) {
			  // TODO: Log the answer in a database
			  console.log("你的答案是", answer);
			  node.send(sender, 'verify',answer);//发送问题去验证
			});
			break;
        }
    }
});

node.on('node::verify', function (sender,result) {
    console.log('verify from', sender);
    if(result==answers[sender])
        node.broadcast('right',sender);
});

node.on('node::right', function (sender,voter) {
    console.log('right from', sender);
    corrects[voter]++;
    completeOperation(voter);
});

node.on('node::online', function (newNode) {
    console.log('Someone is online:', newNode.id);
    node.send(newNode.id, 'hello');
    ids.push(newNode.id);
});



node.on('node::hello', function (sender) {
	console.log('Hello from', sender);
    ids.push(sender);
	node.emit('vote');
});
