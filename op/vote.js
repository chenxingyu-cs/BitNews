
var node = require('./online.js').Node;
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
node.news_ids[node.id]='0';
node.ops[node.id]='plus';
node.emit('vote');
//创建出题人
function createAuthor(sender)
{
	node.authors[sender]=new Array();
	var i;
	for(i=0;i<ids.length;i++)
		if(node.ids[i]==sender)
			break;
	var j=0;
	while(1)
	{
		i=(i+1)%node.ids.length;
		if(node.ids[i]==sender)
			break;
		else if(j>10)
			break;
		else
		{
			j++;
			node.authors[sender].push(ids[i]);
			console.log("create_author:",node.ids[i]);
		}
	}
}
function completeOperation(voter)
{
    if(node.corrects[voter]>=8)
    {
        if(node.ops[voter]=='plus')
        {
            node.news_ids[voter];//该id上升一位
        }
        else
        {
            node.news_ids[voter];//该id下降一位
        }
    }
}
function vote(news_id,op)
{
		node.news_ids[node.id]=news_id;
		node.ops[node.id]=op;
		node.emit('vote');
}
//点击投票，发出请求，发送vote事件
node.on('vote', function () {
	console.log('I am want to vote:', node.id);
    var vote_info=new Object();
    vote_info.op=node.ops[node.id];
    vote_info.news_id=node.news_ids[node.id].;
	node.broadcast('vote',vote_info);
});

//接收投票来源
node.on('node::vote', function (sender,vote_info) {
	console.log('vote from', sender);
    node.ids.sort();
    node.corrects[sender]=0;
    node.ops[sender]=vote_info.op;
    node.news_ids[sender]=vote_info.news_id;
    createAuthor(sender);
    for(var i=0;i<node.authors[sender].length;i++)//如果出题人包含自己，则需要出题
    {
        if(node.id==node.authors[sender][i])
        {
            rl.question("请出题? ", function(problem) {
			  // TODO: Log the answer in a database
			  console.log("你的题目是", problem);
			  node.send(sender, 'answer',problem);//发送问题去验证
			  node.answers[sender]=problem;//这里需要改成答案
			});
            break;
        }
    }
});


node.on('node::problem', function (sender,problem) {
    console.log('problem from', sender);
    for(var i=0;i<node.authors[node.id].length;i++)
    {
        if(sender==node.authors[node.id][i])//如果出题人在自己的列表中
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
    if(result==node.answers[sender])
        node.broadcast('right',sender);
});

node.on('node::right', function (sender,voter) {
    console.log('right from', sender);
    node.corrects[voter]++;
    completeOperation(voter);
});

