require('console.table');
var mysql = require('mysql');
var inquirer = require('inquirer');
var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,

	user: 'root',
	password: 'root',
	database: 'bamazon'
});

var productArray;

connection.connect(function(err){
	if(err){throw err;}
	console.log("connected as id: "+connection.threadId);
	getResults();
});

function getResults(){
	connection.query('select * from products', function(err, results){
		if(err){throw err;}
		for(i=0; i<results.length; i++){
			console.table([
			{
				ID: results[i].item_id,
				ProductName: results[i].product_name,
				Price: results[i].price
			}
			]);
		}

		inquirer.prompt([
		{
			type: 'list',
			message: 'Select the ID of the item you would like to purchase.',
			choices: function(){
				var idArray = [];
				productArray = [];
				for(i=0; i<results.length; i++){
					productArray.push(results[i]);
					var temp = results[i].item_id;
					var idString = temp.toString();
					idArray.push(idString.trim());
				}
				return idArray;
			},
			name: 'selection'
		},
		{
			type: 'input',
			message: 'How many units would you like to purchase?',
			name: 'quantity',
			validate: function(value){
				if(isNaN(value) === false){
					return true;
				}
				return false;
			}
		}
		]).then(function(answer){
			var chosenItem;
			for(i=0; i<productArray.length; i++){
				if(answer.selection == productArray[i].item_id){
					var chosenItem = productArray[i];
				}
			}
			if(chosenItem.stock_quantity > answer.quantity){
				var newQuantity = chosenItem.stock_quantity - answer.quantity;
				var cost = answer.quantity * chosenItem.price;
				connection.query('UPDATE products SET ? WHERE ?', [{stock_quantity: newQuantity}, {item_id: answer.selection}], function(err){
					if(err){throw err;}
					console.log('Item(s) purchased successfully. Total cost: $'+cost);
					connection.end();
				})
			}
			else{
				console.log('-------------------------------------');
				console.log('-------------------------------------');
				console.log('INSUFFICIENT QUANTITY FOR YOUR ORDER!');
				console.log('-------------------------------------');
				console.log('-------------------------------------');
				inquirer.prompt([
				{
					type: 'confirm',
					message: 'Would you like to continue shopping?',
					name: 'shop'
				}]).then(function(answer){
					if(answer.shop === true){
						getResults();
					}
					else{
						connection.end();
					}
				})
			}
		})
	})
}