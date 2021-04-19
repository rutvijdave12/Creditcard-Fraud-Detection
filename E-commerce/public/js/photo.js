const url_id=document.getElementById("url_id").innerText;
    // load webcam
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
            document.getElementById("camera").innerHTML = `<img src="${data_uri}" >`
            document.querySelector(".capture").classList.add("hide");
            document.querySelector(".save").classList.remove("hide");

        })
    }


    function savePhoto(){
        // alert(imgUrl);
        Webcam.upload( imgUrl, '/'+url_id+'/photo', function(code, text) {
            // alert(code, text);
            
        });
    }

const addImageButton = document.getElementById('save');

addImageButton.addEventListener('click', async event => {
    
  const url = 'http://localhost:3000/'+url_id+'/photo';
  const data={imgUrl};
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  const myJson = await response.json();
  console.log(myJson);
  

});

    function clearPic(){
        Webcam.unfreeze();
        imgUrl = null;
        document.getElementById("camera").innerHTML = "";
        Webcam.reset();
        Webcam.attach("#camera");
        document.querySelector(".capture").classList.remove("hide");
        document.querySelector(".save").classList.add("hide");
        

    }