var callbacks={

    onkeyUp: (event) =>{
        var element=document.getElementById(event.key.toUpperCase());
        if (element && element.id!=='P'){
          element.style.backgroundColor=color_button;
        }

        if(keys[event.keyCode]) {
          keys[event.keyCode] = false;
        switch(event.keyCode){
          // press 1
          case KEY_CODE.ONE:
            if (!document.fullscreenElement) {
              callbacks.toggleFullScreen();
            }
          break;
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
            },

    toggleFullScreen:()=>{
        if(!document.fullscreenElement) {
            canvas.requestFullscreen();
        }
    },
  }

$("#vel_k_means").on("input change", function() { 
  switch(this.value){
      case "0":
        rate_k_means="slow";
      break;
      case "1":
        rate_k_means="medium";
      break;
      case "2":
        rate_k_means="fast";
      break;

  }
    
});


$("#showNegativeAxes").click(()=>{
  showNegativeAxes= showNegativeAxes ? 0 : 1;
});


