from flask import Flask, request, jsonify, render_template, url_for, flash, redirect, session, request, logging
import face_recognition
import requests

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret123"


@app.route("/verify", methods=["POST"])
def verify():
    req_data = request.get_json()
    client_image_response = requests.get(req_data["client_image"])
    client_image_file = open("images/uploads/client.jpeg", "wb")
    client_image_file.write(client_image_response.content)
    client_image_file.close()
    customer_image_response = requests.get(req_data["customer_image"])
    customer_image_file = open("images/uploads/customer.jpeg", "wb")
    customer_image_file.write(customer_image_response.content)
    customer_image_file.close()
    client_image = face_recognition.load_image_file("images/uploads/client.jpeg")
    customer_image = face_recognition.load_image_file("images/uploads/customer.jpeg")
    client_encoding = face_recognition.face_encodings(client_image)[0]
    customer_encoding = face_recognition.face_encodings(customer_image)[0]
    results = face_recognition.compare_faces([client_encoding], customer_encoding)
    
    if results[0]:
        return {"verified":True}
    else:
        return {"verified":False}
    


# Run server
if __name__ == "__main__":
    app.secret_key = "secret123"
    app.run(debug=True, host='0.0.0.0', port=500)