function sendMessage(){

    let user = document.getElementById("username").value.trim();
    let text = document.getElementById("message").value.trim();

    if(text=="") return;

    db.collection("chat").add({
        user:user || "Guest",
        text:text,
        time:Date.now()
    });

    document.getElementById("message").value="";
}

db.collection("chat")
.orderBy("time")
.onSnapshot((snapshot)=>{

    let html="";

    snapshot.forEach(doc=>{

        let d=doc.data();

        html += `
        <div class="msg">
            <b>${d.user}</b><br>
            ${d.text}
        </div>`;

    });

    document.getElementById("chatBox").innerHTML=html;
    document.getElementById("chatBox").scrollTop=999999;

});
