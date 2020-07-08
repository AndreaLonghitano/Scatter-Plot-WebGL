#!/usr/bin/env python
# coding: utf-8

# In[57]:


import json
import pandas as pd
import numpy as np
with open('irisCG.json') as f:
    data=json.load(f)
    


# In[58]:


df=pd.DataFrame(data['values'])
centroids=df.groupby(['class']).mean()
centroids


# In[59]:


centroids.applymap(lambda x: x+np.random.uniform(0,2))


# In[60]:


centroids.to_json('centroids.json','split')


# In[ ]:




