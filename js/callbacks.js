var callbacks={

    onkeyUp: (event) =>{
        var element=document.getElementById(event.key.toUpperCase());
        if (element && element.id!=='P' && element.id!=='K'){
          element.style.backgroundColor=color_button;
        }

        if(keys[event.keyCode]) {
          keys[event.keyCode] = false;
        switch(event.keyCode){
          
          // W
          case KEY_CODE.W:
            vz += 1.0;

          break;
          
          // S
          case KEY_CODE.S:
            vz -= 1.0;

          break;
          
          //A
          case KEY_CODE.A:
            vx += 1.0;

          break;
          
          // D
          case KEY_CODE.D:
            vx -= 1.0;


          break;



          case KEY_CODE.Q:
            vy-=1

          break;

          case KEY_CODE.E:
            vy+=1

          break;

         


          case KEY_CODE.ARROWLEFT:
        //console.log("KeyDown  - Dir LEFT");
            rvy = rvy - 1.0;
            break;
            case KEY_CODE.ARROWRIGHT:
        //console.log("KeyDown - Dir RIGHT");
            rvy = rvy + 1.0;
            break;
            case KEY_CODE.ARROWUP:
        //console.log("KeyDown - Dir UP");
            rvx = rvx - 1.0;
            break;
            case KEY_CODE.ARROWDOWN:
        //console.log("KeyDown - Dir DOWN");
            rvx = rvx + 1.0;
            break;


           //k-means
           case KEY_CODE.K:

            break;
  
            // PCA
            case KEY_CODE.P:
  
            break;

    
        }
    }
  },
    onKeyDown:(event) =>{
        // display property

        var element=document.getElementById(event.key.toUpperCase());
            if (element) {
              element.style.backgroundColor="#FF7948";
            }


        if(!keys[event.keyCode]) {
          keys[event.keyCode] = true;
  
            switch(event.keyCode){
              // press 1
              case KEY_CODE.ONE:
                if (!document.fullscreenElement) {
                  callbacks.toggleFullScreen();
                }
              break;
              // W
              case KEY_CODE.W:
                vz -= 1.0;
                
              break;
              
              // S
              case KEY_CODE.S:
                vz += 1.0;

              break;
              
              //A
              case KEY_CODE.A:
                vx -= 1.0;
              break;
              
              // D
              case KEY_CODE.D:
                vx += 1.0;
              break;

      

            case KEY_CODE.ARROWLEFT:
              //console.log("KeyDown  - Dir LEFT");
                  rvy = rvy + 1.0;
            break;
            
            case KEY_CODE.ARROWRIGHT:
        //console.log("KeyDown - Dir RIGHT");
            rvy = rvy - 1.0;
            break;
            case KEY_CODE.ARROWUP:
        //console.log("KeyDown - Dir UP");
            rvx = rvx + 1.0;
            break;
            case KEY_CODE.ARROWDOWN:
        //console.log("KeyDown - Dir DOWN");
            rvx = rvx - 1.0;
            break;


              break;

              
              case KEY_CODE.Q:
                vy+=1;

              break;

              case KEY_CODE.E:
                vy-=1;

              break;

               //k-means
               case KEY_CODE.K:
                 // once you run kmeans you cannot stop it
                 if(!kmeans){
                  kmeans=!kmeans;
                  if(!($('#x_range').prop('disabled'))){
                    $(".multirange").prop('disabled', true);
                  items.forEach((element,index) => {
                    if(items[index].get_display()){
                      dataset_kMeans.push([element.get_x(),element.get_y(),element.get_z()]);
                      selected_element.push(index);
                    }
                  });
                  ObjKMeans=new KMeans(dataset_kMeans,centroids,rate_k_means,DISTANCE_KMEANS[0]);
                  $("#distance_selection").prop('disabled', true);
                  last_centroid=centroids;
                }
                }

                break;
  
                // PCA
                case KEY_CODE.P:
                  pca=!pca;
                  if(!($('#x_range').prop('disabled'))){
                    $(".multirange").prop('disabled', true);
                    items.forEach((element,index) => {
                      if(items[index].get_display()){
                         dataset_pca.push([element.get_x(),element.get_y(),element.get_z()]);
                         selected_element.push(index);
                      }
                    });
                    var eigenvectors = PCA.getEigenVectors(dataset_pca);
                    adjusted_data_x=PCA.computeAdjustedData(dataset_pca,eigenvectors[0],eigenvectors[1]).adjustedData[0];
                    adjusted_data_y=PCA.computeAdjustedData(dataset_pca,eigenvectors[0],eigenvectors[1]).adjustedData[1];
                  }
                break;
                }
              }
            }
  }



$("#showNegativeAxes").click(()=>{
  showNegativeAxes= showNegativeAxes ? 0 : 1;
});


$('#spec_shine').on('input change', function() {
  SpecShine=this.value;
});
// TODO: FIX error cone_in, cone_out
$("#cone_out").on('input change',function() {
  lightConeOut=this.value;
});

$("#cone_in").on('input change',function(){
  lightConeIn=this.value/100;
});

$("#x_light").on('input change',function(){
  dirLightPos_x=this.value;
});

$("#y_light").on('input change',function(){
  dirLightPos_y=this.value;
});

$("#z_light").on('input change',function(){
  dirLightPos_z=this.value;
  console.log(dirLightPos_z);
});

$("#alfa_light").on('input change',function(){
  var t = -utils.degToRad(this.value);
  var p = -utils.degToRad($("#beta_light").val());
	directionalLight = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
});

$("#beta_light").on('input change',function(){
  var t = -utils.degToRad($("#alfa_light").val());
  var p = -utils.degToRad(this.value);
	directionalLight = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
});

$("#alfa_ambient").on('input change',function(){
  var t = -utils.degToRad(this.value);
  var p = -utils.degToRad($("#beta_ambient").val());
  ambientLightDir = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
});

$("#beta_ambient").on('input change',function(){
  var t = -utils.degToRad($("#alfa_ambient").val());
  var p = -utils.degToRad(this.value);
  ambientLightDir = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
});

$("#texactive").click(()=>{
  texture_mix= 1 - texture_mix;
});

