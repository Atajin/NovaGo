function afficherTransaction(idTransaction, dateTransaction) {
    // Construct the content string
    var content = "Transaction " + idTransaction + " - " + dateTransaction;
    
    // Update the content of the element with ID 'nomBillet'
    document.getElementById("nomBillet").innerHTML = content;
}