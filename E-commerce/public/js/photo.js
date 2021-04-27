const url_id=document.getElementById("url_id").innerText;
 
    Webcam.set({
        width:450,
        height:450,
        image_format:'jpeg',
        jpeg_quality:90
    });
    
    Webcam.attach("#camera");
    imgUrl = null;
    function showPreview(){
        Webcam.snap(function(data_uri){
            imgUrl = data_uri;
            Webcam.reset();
            document.getElementById("camera").innerHTML = `<img src="${data_uri}" height=400 width=400 style="padding:20px;" >`
            document.getElementById("mydata").setAttribute("value", imgUrl);
            document.querySelector(".capture").classList.add("hide");
            document.querySelector(".save").classList.remove("hide");

        })
    }


    function clearPic(){
        Webcam.unfreeze();
        imgUrl = null;
        document.getElementById("camera").innerHTML = "";
        Webcam.reset();
        Webcam.attach("#camera");
        document.querySelector(".capture").classList.remove("hide");
        document.querySelector(".save").classList.add("hide");
        

    }
    
    