App = {

//Web3 object
  web3Provider: null,
 //for storing contract instances
  contracts: {},
  //for current account
  account: '0x0',

//initialise the page
  init: function() {
     return App.initWeb3();
  },

//initialise web3
  initWeb3: function() {
    
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    
      return App.initContract();
  },

//initialise contracts
  initContract: function() {

      $.getJSON("Election.json", function(election) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.Election = TruffleContract(election);
        // Connect provider to interact with contract
        App.contracts.Election.setProvider(App.web3Provider);
        //App.listenForEvents();

        return App.render();
    });
  },

//render the page whenever changes are made
  render: function() {

        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");
        var flag;

        loader.show();
        content.hide();

    //get current account provided by metamask
        ethereum.request({ method: 'eth_requestAccounts' }).then((result)=>{

          App.account = result;
          $("#accountAddress").html("Your Account: " + App.account);
        });

    //when there is a change in accounts on metamask
        window.ethereum.on('accountsChanged', function (accounts) {


          App.contracts.Election.deployed().then(function(instance){
            App.account = accounts;
            return instance.voters(App.account);
          }).then(function(hasVoted){
            if(hasVoted){
              //if changed account has already voted
              $("#accountAddress").html("Your Account: " + App.account);
              $('form').hide();
              
            }
            else{
              //if changed account has not voted yet
              $("#accountAddress").html("Your Account: " + App.account);
              $('form').show();
      
            }

          })          
        });

      

     
    // Load contract data
        App.contracts.Election.deployed().then(function(instance) {

          electionInstance = instance;
          return electionInstance.candidatesCount();

        }).then(function(candidatesCount) {

          var candidatesResults = $("#candidatesResults");
          
          candidatesResults.empty();

          var candidatesSelect = $('#candidatesSelect');
          candidatesSelect.empty();

         
          for (var i = 1; i <= candidatesCount; i++) {

            electionInstance.candidates(i).then(function(candidate) {

              var id = candidate[0];
              var name = candidate[1];
              var voteCount = candidate[2];

              // Render candidate Result
              var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
              candidatesResults.append(candidateTemplate);

              // Render candidate ballot option
              var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
              candidatesSelect.append(candidateOption);
            });
          }
          
          return electionInstance.voters(App.account);
        }).then(function(hasVoted) {


            // Do not allow a user to vote
            if(hasVoted) {
              $('form').hide();
            }

            loader.hide();
            content.show();
          }).catch(function(error) {
            
            console.warn(error);
          });
  },


castVote: function() {

      var candidateId = $('#candidatesSelect').val();

      App.contracts.Election.deployed().then(function(instance) {
      
        return instance.vote(candidateId, { from: App.account });
      }).then(function(result) {
      
        // Wait for votes to update
        $("#content").hide();
        $("#loader").show();
        //if a vote happened,render the page
        if(result.logs[0].event == 'votedEvent'){
          App.render();
        }


      }).catch(function(err) {

        console.error(err);
      });
    }
};



$(function() {
  $(window).load(function() {
    App.init();
  });
});