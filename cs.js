//an id to store the id of the created context menu item
let x;
let y;

//creating a new connection to the background script
const port = chrome.runtime.connect({name: `query_line`});


//listening on this port if the user clicked on the context menu item
//we will get a new connection to the script from the bg page
chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(function(msg) {
        if(msg.response === "create_div"){
            //we will create a div to show the meaning and now disconnect from the bg
            create_div(msg.search_phrase);
        }
    });
});

const selection_handler = () => {
    const selection = document.getSelection().toString().trim();

    if(selection){
        //sending a message specifying the selection made by the user
        port.postMessage({search_phrase: selection});
    }
}

//adding an event listener on selectionchange event
//fires each time the user makes a selction. The selection can also be blank
document.addEventListener('selectionchange', selection_handler);

async function create_div(selection){
    //a constant padding applied to move the box away from the selected word
    const padding_space = 15;

    //we create a box and then lay it on top of the page
    let div = document.createElement('div');
    div.id = 'definition_box';

    //move the div to the cursors positon
    div.style.top = `${getMouseY() + padding_space}px`;
    div.style.left = `${getMouseX() + padding_space}px`;

    //create the header div that will have the close icon and the selected word/phrase
    const header_div = document.createElement('div');
    header_div.id = 'header_div';

    //create the heading that will have the word/phrase inside it
    const header_selection = document.createElement('h3');
    header_selection.id = 'header_selection';
    header_selection.innerText = selection;

    //create the close icon
    // const div_close_box = document.createElement('div');
    // div_close_box.id = 'div_close_box';
    // div_close_box.innerText = 'x';

    //append the elements
    header_div.appendChild(header_selection);
    // header_div.appendChild(div_close_box);

    //append the header_div
    div.appendChild(header_div);

    if(selection.split(' ').length == 1){
        //this is a word
        //get the meaning
        const meanings = await getWordMeaning(selection);

        //checking if the function .map can be applied to the returned value
        if(meanings.map === undefined){
            //we have an error
            //we should store this word that was searched and then save it for later
            const p = document.createElement('p');
            p.innerText = `${meanings}`;
            div.appendChild(p);
        }else{
            //show the selection and the meaning
            //loop through each meaning and then display each definition in a display
            meanings.map((el) => {
                //create a p and append it to the div
                let p = document.createElement('p');
                p.innerText = `(${el.partOfSpeech}): ${el.definitions[0].definition}`;

                //append this to the div
                div.appendChild(p);

                //an example from the definition
                if(el.definitions[0].example !== undefined){
                    //there is an example that can be added
                    p = document.createElement('p');
                    p.innerText = `Example: ${el.definitions[0].example}`;
                    div.appendChild(p);
                }
            });
        }
    }

    //this is a phrase
    //get the similar words
    getPhraseSynonym(selection).then((meaning) => {
        //show the selection and the meaning
        //create a p and append it to the div
        const p = document.createElement('p');
        p.innerText = `Synonyms: ${meaning}`;

        //append this to the div
        div.appendChild(p);

        appendDivToBody(div);
    });
}

async function getPhraseSynonym(selection){
    //beautify the search string
    let phrase = selection.split(' ').join('+');
    let meaning = '';   


    let response = await fetch(`https://api.datamuse.com/words?ml=${phrase}`)
    let data = await response.json();

    if(data[0]){
        meaning = data[0].word;
    }

    if(data[1]){
        meaning += `, ${data[1].word}`;
    }

    if(data[2]){
        meaning += `, ${data[2].word}`;
    }

    return meaning;
}

async function getWordMeaning(selection){
    let word = selection.split(' ')[0];

    let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    let data = await response.json();

    //error checking if the definition doesn't exist
    if(data[0] === undefined){
        return `${data.message} ${data.resolution}`;
    }

    return data[0].meanings;
}

//appends the div to the body of the page
function appendDivToBody(div){
    //the body element
    const body = document.getElementsByTagName('body')[0];
    body.appendChild(div);
    div.classList.add('fade_out');
    setTimeout(() => div.remove(), 10*1000);
}

//track the mouse movement
document.addEventListener('mousemove', updateMousePos, false);
document.addEventListener('mouseenter', updateMousePos, false);

function updateMousePos(e){
    x = e.pageX;
    y = e.pageY;
}

const getMouseX = () => x;
const getMouseY = () => y;