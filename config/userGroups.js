module.exports = {
  Admin :{
    selfOnly:false,
    Users:{
      View: true,
      ViewAll: true,
      Add: true,
      Edit: true,
      Delete: true
    },
    Prospects:{
      View: true,
      ViewAll: true,
      Add: true,
      Edit: true,
      Delete: true
    },
    Products:{
      View: true,
      ViewAll: true,
      Add: true,
      Edit: true,
      Delete: true
    }
  },
  Spectator :{
    selfOnly:false,
    Users:{
      View: true,
      ViewAll: true,
      Add: false,
      Edit: false,
      Delete: false
    },
    Prospects:{
      View: true,
      ViewAll: true,
      Add: false,
      Edit: false,
      Delete: false
    },
    Products:{
      View: true,
      ViewAll: true,
      Add: false,
      Edit: false,
      Delete: false
    }
  },
  Sales :{
    selfOnly:true,
    Users:{
      View: true,
      ViewAll: false,
      Add: false,
      Edit: true,
      Delete: false
    },
    Prospects:{
      View: true,
      ViewAll: false,
      Add: true,
      Edit: true,
      Delete: false
    },
    Products:{
      View: false,
      ViewAll: true,
      Add: false,
      Edit: false,
      Delete: false
    }
  },
  Tech :{
    selfOnly:true,
    Users:{
      View: true,
      ViewAll: false,
      Add: false,
      Edit: true,
      Delete: false
    },
    Prospects:{
      View: true,
      ViewAll: false,
      Add: true,
      Edit: true,
      Delete: false
    },
    Products:{
      View: false,
      ViewAll: true,
      Add: false,
      Edit: false,
      Delete: false
    }
  }
}
