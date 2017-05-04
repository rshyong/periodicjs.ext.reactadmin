'use strict';


module.exports = {
  'containers':{
    '/r-admin/content/formeditor':{
      'layout':{
        component: 'Hero',
        props: {
          style: {
            padding:'5rem 0',
          },
        },
        // props: { size: 'isFullheight', },
        children: [ {
          component: 'HeroBody',
          props:{},
          children: [
            {
              component: 'Container',
              props:{},
              children:[
                {
                  component: 'Title',
                  children:'TEST EDITOR',
                },
                
                { 
                  component: 'ResponsiveForm',
                  // thisprops: {
                  //   formdata:[ 'dynamic', ],
                  // },
                  props: {
                    cardForm: {},
                    onSubmit: 'func:this.props.setDynamicData',
                    onChange: 'func:this.props.setDynamicData',
                    flattenFormData: true,
                    style: {
                      marginBottom:'20px',
                    },
                    formgroups: [
                      {
                        gridProps: {},
                        formElements: [
                          {
                            type: 'editor',
                            name: 'templatehtml',
                            label: 'Template HTML',
                            validateOnChange: true,
                          },
                        ],
                      },
                      {
                        formElements: [
                          {
                            type: 'submit',
                            value: 'Submit',
                          },
                        ],
                      },
                      {
                        formElements:[
                          {
                            type:'layout',
                            value: {
                              component: 'RawStateOutput',
                              props: {
                                select: 'dynamic',
                                style: {
                                  padding:'10px',
                                  margin: '10px',
                                  border:'1px solid black',
                                },
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        ],
      },
      'onFinish':'render',
      'pageData':{
        'title':'Home',
        'navLabel':'Home',
      },
    },
  },
};

