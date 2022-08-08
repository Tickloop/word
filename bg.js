//will use this to store the search phrase
let sp;
// let id = 0;

//setting up connection to content script to send and receive messages
chrome.runtime.onConnect.addListener((port) => {	
	port.onMessage.addListener((msg) => {
		//checking if the search phrase is empty
		if(msg.search_phrase){
			//check if the id is 0 indicating that we need to create a new item
			/* if(id === 0){
				//we need to create a context menu item
				//create the menu item
				id = chrome.contextMenus.create({
				    "title": `Define "${msg.search_phrase}"`,
				    "contexts": ["selection"],
				    "id": "2A"
			  	});
			}else{
				//we have already created the item, we just need to update the title
				chrome.contextMenus.update(id, {
					"title": `Define "${msg.search_phrase}"`,
				});
			} */
			chrome.contextMenus.removeAll(() => {});
			chrome.contextMenus.create({
				"title": `Define "${msg.search_phrase}"`,
			    "contexts": ["selection"],
			    "id": "2A"
			});
			sp = msg.search_phrase;
		}
	});
});

//listens for a click on the menu
chrome.contextMenus.onClicked.addListener(() => {
	//find the tab where the click was registered. It has to be active and in the current window
	//else the user wouldn't have selected the word and searched it
	chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
		//creating a new port of connection specific to the tab
		const port_reply = chrome.tabs.connect(tab[0].id, {frameId: 0});

		//posting a message to create a div for this word
		port_reply.postMessage({response: "create_div", search_phrase: sp});
	})
});
