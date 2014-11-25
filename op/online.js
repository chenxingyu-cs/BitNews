
var Node = require('n2n').Node;

var node = new Node(4321);
node.connect([{ host: '223.3.86.168', port: 6785 }]);
node.ids=[]//存放所有id
node.answers=[]//存放正确答案
node.corrects=[]//存放正确个数
node.ops=[]//存放操作，顶还是踩
node.news_ids=[]//存放新闻id
node.authors=[]//存放出题者id
node.on('online', function () {
	console.log('I am online:', node.id);
	node.ids.push(node.id);
});
node.on('node::online', function (newNode) {
    console.log('Someone is online:', newNode.id);
    node.send(newNode.id, 'hello');
    node.ids.push(newNode.id);
});
node.on('node::hello', function (sender) {
	console.log('Hello from', sender);
    node.ids.push(sender);
});
exports.Node = node;