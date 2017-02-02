'use strict';

module.exports = {
  layout: {
    component: 'Hero',
    props: { size: 'isFullheight', },
    children: [ {
      component: 'HeroBody',
      props:{},
      asyncprops: {
        healthcheck: ['healthcheckStatus',],
      },
      children: [ {
        component: 'Container',
        props:{},
        children:[{
          component: 'Content',
          props: {},
          children: [{
            component: 'h1',
            children: 'PAGE NOT FOUND',
          },
          // {
          // 	component: 'div',
          // 	children: 'Some dynamic content'
          //   },
          {
            component: 'RawOutput',
            props: {
              select: 'locationdata',  
              type: 'block',
              display: true,
            },  
            windowprops: {
              locationdata:['location', 'href',],
            },  
          }, ],
        }, ],
      }, ],
    }, ],
  },
  resources: {
    healthcheckStatus:'/load/healthcheck',
  },
  onFinish:'render',
};