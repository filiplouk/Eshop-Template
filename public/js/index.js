// --------------------------Cart with items-----------------------------------------


// Change price when number of product is changed & Post new items number to the server
let quantity = document.querySelectorAll(".quantity");


quantity.forEach(function(item){
  item.addEventListener('change', (event)=>{
    let value=event.target.value;
    let id =event.target.name


    let item_price=document.getElementById(id).getElementsByClassName("price")[0];
    price = item_price.id;
    item_price.innerHTML= Math.round(Number(price)*value*100)/100;

    $.ajax({
      type:"POST",
      url:"/cart/change",
      data:{
        id:id,
        quantity:value
      }
    })

  });
});

// Add plus 1 at the cart bagde right up when a new item is put inside

let submitItemButton = document.querySelector(".button_info button");

submitItemButton.addEventListener("click", function(event){
  document.querySelector("#basket span").innerHTML = Number(document.querySelector("#basket span").innerHTML)+1;
});
