/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/


export const environment = {
  production: false,
  environment: 'local',
  apiEndpoint: 'http://localhost:8086',
  fileUploadEndpoint: 'http://localhost:8086/import/poams',
  stigmanCollectionImportEndpoint: 'http://localhost:8086/import/stigmanagercollection',
  stigmanAssetImportEndpoint: 'http://localhost:8086/import/stigmanagerassets',
  getScanResultsFromTenableEndpoint: 'http://0.0.0.0:9000/scanResults/', //placeholder
  tenableAccessKey: 'placeholder',
  tenableSecretKey: 'placeholder',
  getSTIGsFromSTIGMANEndpoint: 'http://localhost:54000/api/stigs/',
  getCollectionsFromSTIGMANEndpoint: 'http://localhost:54000/api/collections/',
  getAvailableAssetsFromSTIGMANEndpoint: 'http://localhost:54000/api/assets?collectionId=',
  getAssetsFromSTIGMANEndpoint: 'http://localhost:54000/api/assets/',
  getSTIGAssociatedAssetsEndpoint: 'http://localhost:54000/api/collections/',
  authizeEndpoint: 'http://localhost:2020/realms/RMFTools/protocol/openid-connect/auth',
  tokeEndpoint: 'http://localhost:2020/realms/RMFTools/protocol/openid-connect/token',
  redirectUri: 'http://localhost:4200/callback',
  frontEndEndpoint: 'http://localhost:4200',
  keycloakUrl: 'http://localhost:2020',
  CPATRedirectUri: 'http://localhost:4200/consent',
  tokenReturnUrl: "http://localhost:2020/realms/RMFTools/protocol/openid-connect/token",
  version: '1.0.0',


  // Set classification to on of: 
  //  classification    classificationCode    ClassificatonColorCode
  //  'UNCLASSIFIED'            'U '                '#5cb85c'
  //  'CONFIDENTIAL'            'C'                 '#286090'
  //  'SECRET'                  'S'                 '#d9534f'
  //  'TOP SECRET'              'T'                 '#f0ad4e'
  // 
  classification: 'UNCLASSIFIED',
  classificationCode: 'U',
  classificationColorCode: '#5cb85c'

};
