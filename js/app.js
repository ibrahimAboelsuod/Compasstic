angular.module('compasstic', ['compasstic.factories', 'compasstic.controllers'])
.run(
    function() {

    }
).constant("$pagesProvider",{
        "7976226799":{
            id:"7976226799",
            name:"The Daily Show"
        },
        "5281959998":{
            id:"5281959998",
            name:"The New York Times"
        },
        "10714086302":{
            id:"10714086302",
            name:"Saturday Night Live"
        },
        "114219621960016":{
            id:"114219621960016",
            name:"Samsung Mobile"   
        }
    }
).constant("$appDataProvider",{
        FB: {
            ID: "1835491116686888",
            secret: "b46eb511f1dbe0d54afc6c93f3056dda",
            grantTypes: "client_credentials"
        }
    }
).constant("$stopWordsProvider", {//174 word
        "a":{sw: true}, "about":{sw: true}, "above":{sw: true},
        "after":{sw: true}, "again":{sw: true}, "against":{sw: true},
        "all":{sw: true}, "am":{sw: true}, "an":{sw: true},
        "and":{sw: true}, "any":{sw: true}, "are":{sw: true},
        "aren't":{sw: true}, "as":{sw: true}, "at":{sw: true},
        "be":{sw: true}, "because":{sw: true}, "been":{sw: true},
        "before":{sw: true}, "being":{sw: true}, "below":{sw: true},
        "between":{sw: true}, "both":{sw: true}, "but":{sw: true},
        "by":{sw: true}, "can't":{sw: true}, "cannot":{sw: true},
        "could":{sw: true}, "couldn't":{sw: true}, "did":{sw: true},
        "didn't":{sw: true}, "do":{sw: true}, "does":{sw: true},
        "doesn't":{sw: true}, "doing":{sw: true}, "don't":{sw: true},
        "down":{sw: true}, "during":{sw: true}, "each":{sw: true},
        "few":{sw: true}, "for":{sw: true}, "from":{sw: true},
        "further":{sw: true}, "had":{sw: true}, "hadn't":{sw: true},
        "has":{sw: true}, "hasn't":{sw: true}, "have":{sw: true},
        "haven't":{sw: true}, "having":{sw: true}, "he":{sw: true},
        "he'd":{sw: true}, "he'll":{sw: true}, "he's":{sw: true},
        "her":{sw: true}, "here":{sw: true}, "here's":{sw: true},
        "hers":{sw: true}, "herself":{sw: true}, "him":{sw: true},
        "himself":{sw: true}, "his":{sw: true}, "how":{sw: true},
        "how's":{sw: true}, "i":{sw: true}, "i'd":{sw: true},
        "i'll":{sw: true}, "i'm":{sw: true}, "i've":{sw: true},
        "if":{sw: true}, "in":{sw: true}, "into":{sw: true},
        "is":{sw: true}, "isn't":{sw: true}, "it":{sw: true},
        "it's":{sw: true}, "its":{sw: true}, "itself":{sw: true},
        "let's":{sw: true}, "me":{sw: true}, "more":{sw: true},
        "most":{sw: true}, "mustn't":{sw: true}, "my":{sw: true},
        "myself":{sw: true}, "no":{sw: true}, "nor":{sw: true},
        "not":{sw: true}, "of":{sw: true}, "off":{sw: true},
        "on":{sw: true}, "once":{sw: true}, "only":{sw: true},
        "or":{sw: true}, "other":{sw: true}, "ought":{sw: true},
        "our":{sw: true}, "ours":{sw: true}, "ourselves":{sw: true},
        "out":{sw: true}, "over":{sw: true}, "own":{sw: true},
        "same":{sw: true}, "shan't":{sw: true}, "she":{sw: true},
        "she'd":{sw: true}, "she'll":{sw: true}, "she's":{sw: true},
        "should":{sw: true}, "shouldn't":{sw: true}, "so":{sw: true},
        "some":{sw: true}, "such":{sw: true}, "than":{sw: true},
        "that":{sw: true}, "that's":{sw: true}, "the":{sw: true},
        "their":{sw: true}, "theirs":{sw: true}, "them":{sw: true},
        "themselves":{sw: true}, "then":{sw: true}, "there":{sw: true},
        "there's":{sw: true}, "these":{sw: true}, "they":{sw: true},
        "they'd":{sw: true}, "they'll":{sw: true}, "they're":{sw: true},
        "they've":{sw: true}, "this":{sw: true}, "those":{sw: true},
        "through":{sw: true}, "to":{sw: true}, "too":{sw: true},
        "under":{sw: true}, "until":{sw: true}, "up":{sw: true},
        "very":{sw: true}, "was":{sw: true}, "wasn't":{sw: true},
        "we":{sw: true}, "we'd":{sw: true}, "we'll":{sw: true},
        "we're":{sw: true}, "we've":{sw: true}, "were":{sw: true},
        "weren't":{sw: true}, "what":{sw: true}, "what's":{sw: true},
        "when":{sw: true}, "when's":{sw: true}, "where":{sw: true},
        "where's":{sw: true}, "which":{sw: true}, "while":{sw: true},
        "who":{sw: true}, "who's":{sw: true}, "whom":{sw: true},
        "why":{sw: true}, "why's":{sw: true}, "with":{sw: true},
        "won't":{sw: true}, "would":{sw: true}, "wouldn't":{sw: true},
        "you":{sw: true}, "you'd":{sw: true}, "you'll":{sw: true},
        "you're":{sw: true}, "you've":{sw: true}, "your":{sw: true},
        "yours":{sw: true}, "yourself":{sw: true}, "yourselves":{sw: true}
    }
).config(
    function() {

    }
);
angular.module('compasstic.factories', []);
angular.module('compasstic.controllers', []);