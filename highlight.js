const node = document.querySelector('#app');
const initialContent = node.innerHTML;
document.querySelector('#search').addEventListener('change', (event) => {
    node.innerHTML = initialContent;
    searchOccurrences(event.target.value);
})

function searchOccurrences(search) {
    if (search.trim() === '') {
        return;
    }
    let wholeTerms = false;
    search = removeAccents(search);
    if (search.startsWith('"') && search.endsWith('"')) {
        search = search.substring(1, search.length - 1);
        wholeTerms = true;
    }
    let searchWordRegex;
    if (wholeTerms) {
        // each letters of the word could be in differents tag
        const searchWord = search.trim().replace(/ /i, ' ').split('').join('(<.*>)?');
        searchWordRegex = new RegExp('(<.*?>[^<]*?|^|^[^<]+?)' + searchWord, 'i');
    } else {
        const searchWord = search
            .trim()
            .replace(/ /i, ' ')
            .split(' ')
            // each letters of the word could be in differents tag
            .map(term => term.split('').join('(<.*>)?'))
            .join('|')
        searchWordRegex = new RegExp('(<.*?>[^<]*?|^|^[^<]+?)' + `(?:${searchWord})`, 'i');
    }
    let contentHtml = node.innerHTML.trim().replace(/ /g, ' ');
    let normalizedContentHtml = removeAccents(contentHtml);
    let newContentHtml = '';
    let totalMatches = 0;
    do {
        const searchWordFound = normalizedContentHtml.match(searchWordRegex);
        if (searchWordFound && searchWordFound[1]) {
            // the searched word is before a tag and/or others text node, and it has been captured
            // we have to remove it, and place cursor (i) at position of searched word
            const indexOfEndOfTagAndNoMatchTextNode = searchWordFound.index + searchWordFound[1].length
            const tag = contentHtml.substring(0, indexOfEndOfTagAndNoMatchTextNode);
            newContentHtml += tag;
            contentHtml = contentHtml.substring(indexOfEndOfTagAndNoMatchTextNode);
            normalizedContentHtml = normalizedContentHtml.substring(indexOfEndOfTagAndNoMatchTextNode);
        } else if (searchWordFound) {
            // searchWordFound[0] contains here only the syntax that correspond with the searched word
            newContentHtml +=  contentHtml.substring(0, searchWordFound.index)
            const wordFind = contentHtml.substring(searchWordFound.index, searchWordFound[0].length);
            const highlightedText = wrapWithHighlight(wordFind, ++totalMatches)
            newContentHtml += highlightedText
            contentHtml = contentHtml.substring(searchWordFound.index + searchWordFound[0].length)
            normalizedContentHtml = normalizedContentHtml.substring(
                searchWordFound.index + searchWordFound[0].length
            );
        } else {
            // the rest of the content to be read does not contain the desired term
            newContentHtml += contentHtml;
            contentHtml = '';
        }
    } while (contentHtml)
    node.innerHTML = newContentHtml;
    console.log('matches', totalMatches)
}

function wrapWithHighlight(text, matchIndex) {
    let wrappedText = '';
    let i = 0;
    const limit = text.length - 1
    do {
        const character = text[i];
        if (character?.match(/( )|\n/)) {
            wrappedText += character;
            i++;
        } else if (character === '<') {
            // If we detect an opening of a tag, we look where it close
            const indexOfEndOfTag = text.indexOf('>', i);
            if (indexOfEndOfTag === -1) {
                wrappedText += text.substring(i);
                break
            } else {
                wrappedText += text.substring(i, indexOfEndOfTag + 1);
                i = indexOfEndOfTag + 1;
            }
        } else {
            // If we detect a text node, we look for end of the text node
            // Then, is when new node will begin
            const indexOfEndOfTextNode = text.indexOf('<', i);
            if (indexOfEndOfTextNode === -1) {
                wrappedText += `<span class="match match-${matchIndex}">` + text.substring(i) + '</span>'
                break
            } else {
                wrappedText += `<span class="match match-${matchIndex}">` + text.substring(i, indexOfEndOfTextNode) + '</span>'
                i = indexOfEndOfTextNode;
            }
        }
    } while (i && i <= limit)
    return wrappedText;
}

function removeAccents (text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
