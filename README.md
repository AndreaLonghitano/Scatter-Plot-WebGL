# Scatter Plot WebGL
This project was developed for the course of Computer Graphics at Polimi AA 2019/2020. It visualizes in a 3D environment the Iris dataset,one of the most popular one for starting with ML. Many functionalities was implemented like filtering the dataset,changing the colour of each class, changing the model for each class. To put in practise what we have studied, we have tried to implement several models of the light (please check this [here](https://scatterplot-webgl.herokuapp.com/) since the buttons are self-explainable)  
Hereunder, a description of what you can do:

<kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> <br/>
<kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Press one of those buttons to navigate around the space.

<kbd>&#8592;</kbd><kbd>&#8593;</kbd><kbd>&#8594;</kbd><kbd>&#8595;</kbd> Concerning the rotation, the camera has two D.O.F. Press one of those buttons, to modify the elevation and angle.

<kbd>P</kbd> It will run PCA alghorithm for point selected.<br/>
<kbd>K</kbd> It will run the k-means alghorithm on the whole dataset. You cannot choose the position of the centroids since it's fixed. Once you run the alghorithm, you can distinguish the centroids since they are characerized by an high contribution of the emission term in the rendering equation.

You can play also with the **texture**. We have decided to implement both *parallax mapping* and *normal mapping* to give to the object a more realistic effect.


There is a checkbox called **fog**. Click it, and you will see a simple fog effect in the environment. This is based on a simple equation where you can set the position of a near plane and a far plane.



# Deployment
The project was deployed on Heroku. You can have a look [here](https://scatterplot-webgl.herokuapp.com/).



# Authors
* [Andrea Longhitano](https://github.com/AndreaLonghitano)
* [Massimo Gennaro](https://github.com/MassimoGennaro)

