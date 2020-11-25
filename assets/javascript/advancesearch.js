function advancesearch()
{
    var x=document.getElementsByClassName("books_result");
    x[0].style.display="none";
    var y=document.getElementsByClassName("advancesearchform");
    y[0].style.display="block";

    document.getElementsByClassName("titlewrapper")[0].style.display="none";
    document.getElementsByClassName("advancesearch")[0].style.display="none";
    document.getElementsByClassName("nextpages")[0].style.display="none";
}

