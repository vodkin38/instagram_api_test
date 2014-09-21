define(['jquery','jsmousewheel','jsscroller','jstimeago','underscore','backbone','backbone.localStorage'],function (jquery,jsmousewheel,jsscroller,jstimeago,sample,underscore,backbone,backbonelocalStorage) {
return {
init: function () {
var CLIENT_ID='1b3c911ea5c64e8bb1c6de123317bc97';
var CLIENT_SECRET='2d9755c0ccf747439e77c1789520613f';
var REDIRECT_URI='http://vodkin38.github.io/instagram_api_test/';
//GET ACCESS TOKEN FUNCTION...DUH
function getAccessToken() {

  var query = window.location.href;
  var param='access_token=';
  var start=query.indexOf(param);
  var end=query.length;
  var str=query.substr(start,end).split("&")[0];
  return(str.substr(param.length,str.length));
}

var AppProperties=Backbone.Model.extend({

	defaults: {
				state: "photos",
				initialized:false,
				photo_count:10,
				comment_count:3,
				current_tag:'',
				next_url:'',
				accessToken:'',
				currentDomEvent:null,
				currentPhotoId:null,
				particular_photo:null,
				just_redirected:false,
			}
});
var userModel=Backbone.Model.extend();
var appProperties=new AppProperties();
appProperties.set({accessToken:getAccessToken()});
var Controller = Backbone.Router.extend({
    routes: {
		"":"photos",
        "photos": "photos",
        "photos/:id": "photo_particular",
		"*actions": "photos"
    },
	getToken:function(param)
	{	
		if(!param && localStorage.getItem('id'))
		{
		appProperties.set({just_redirected:true});
		}
		if(!appProperties.get("accessToken"))
	    {
			var str="https://instagram.com/oauth/authorize/?client_id="+CLIENT_ID+"&redirect_uri="+REDIRECT_URI+"&response_type=token";
			window.location.href = str;
	    }
		else
		{
			if(appProperties.get("currentPhotoId"))
			{
				this.navigate("/photos/"+appProperties.get("currentPhotoId"));
			}
			else
			{
				if(appProperties.get("just_redirected"))//if we were just redirected from instagram
				{
					appProperties.set({currentPhotoId: localStorage.getItem('id')});
					appProperties.set({state: "photo_particular"});
					appProperties.set({just_redirected: false});
					this.navigate("/photos/"+localStorage.getItem('id'));
					localStorage.removeItem('id');
				}
				else
					this.navigate("/photos");
				
			}
			//GETTING USER DATA
			var url_str="https://api.instagram.com/v1/users/self?access_token="+appProperties.get('accessToken');	
			userModel.fetch({
				dataType: 'jsonp',
				url:url_str,
				success:function()
				{
					appProperties.set({initialized:true});
				}});
		}
		
	},
	initialize:function()
	{
		
	},
	
    photos: function () {
			
		appProperties.set({state:"photos"});
		this.getToken();
    },
	
	photo_particular: function (id) {
		
		if(!appProperties.get("currentPhotoId"))
		{
			var a=localStorage.getItem('id');
			if(a==null)
			{
				localStorage.setItem('id',id);//Putting id in local so that redirect wouldn't rewrite it
			}
			else
			{

			}
			appProperties.set({currentPhotoId: id});
			this.getToken(localStorage.getItem('id'));
		}
		appProperties.set({state: "photo_particular"});
		
    },

    
});
var controller = new Controller();

var PhotoModel=Backbone.Model.extend();
var UserModel=Backbone.Model.extend();
var CommentModel=Backbone.Model.extend(
{
	defaults : {
		localStorage: new Backbone.LocalStorage("localComment")
	}
});
var PhotoCollection=Backbone.Collection.extend(
{
	model:PhotoModel,
});
var CommentCollection=Backbone.Collection.extend(
{
	model:CommentModel,
	localStorage: new Backbone.LocalStorage("localComment")
});
var commentModel=new CommentModel();
var userModel=new UserModel();
var photoCollection=new PhotoCollection();
var tempCollection=new PhotoCollection();
var commentCollection=new CommentCollection();

var MainBlock = Backbone.View.extend({
	el: $("#main"),
	tempcollection:tempCollection,
	commentcollection:commentCollection,
	user:userModel,
	initialize: function () {
		var that=this;
		this.model.bind('change:state', this.load_photos, this);
	},
	photos_template: _.template($('#photos').html()),
	photo_particular_template: _.template($('#photo_particular').html()),
	comment_template:_.template($('#comment').html()),
	/*templates: {
		"photos": _.template($('#photos').html()),
		"photo_particular": _.template($('#photo_particular').html()),
		"comment":_.template($('#comment').html())
	},*/ //SOME problems with these...too lazy to look for them
	events: {
            "click #search_button": "photos",
            "keypress #tag_search": "photos",
            "click .instagram_logo": "photos",
			"click .load_more":"load_more",
			"click .image_link":"open_photo",
			"click .tophoto":"open_photo",
			"click .more_comments span":"show_more_comments",
			"keypress .leave_comment":"add_comment",
			
        },
	show_more_comments:function(e)
	{
		var elem=$(e.target);
		elem.hide();
		elem.parent().parent().find('.comment').removeClass('hidden');
		
	},
	add_comment:function(e)
	{
		var that=this;
		var input=$(e.target);
		if(e.keyCode==13 && input.val())
		{
			
			var userdata=that.user.toJSON().data;
			that.commentcollection.fetch();
			var comment = new CommentModel(
			{user:{
				id:userdata.id,
				name:userdata.username,
				profile_picture:userdata.profile_picture
			},
			text:input.val(),
			photoid:input.attr('photoid')});
			that.commentcollection.add(comment);
			comment.save();
			input.val('');
			input.parent().parent().find('.comments_section').append(that.comment_template({"comment":comment.toJSON()}));
		}
		
		//
	},
	photos:function(e)
	{
		this.model.set({currentDomEvent:e});
		if(this.model.get("state")=="photos")
			this.model.trigger("change:state");
		else
			this.model.set({state:"photos"});
		controller.navigate("/photos", true);
	},
	load_more:function(e)
	{
		this.model.set({currentDomEvent:e});
		if(this.model.get("state")=="loading")
			this.model.trigger("change:state");
		else
			this.model.set({state:"loading"});
		controller.navigate("/photos", true);
	},
	open_photo:function(e)
	{
		this.model.set({currentDomEvent:e});
		if(this.model.get("state")=="photo_particular")
			this.model.trigger("change:state");
		else
			this.model.set({state:"photo_particular"});
		controller.navigate("/photos/"+appProperties.get("currentPhotoId"), true);
	},
	load_photos:function()
	{
		
		var curr_event=this.model.get("currentDomEvent");
			var e=this.model.get("currentDomEvent");
			var that=this;
			if(this.model.get("state")=="loading")
			{
				if(appProperties.get("next_url"))
				{
					this.collection.fetch({
							dataType: 'jsonp',
							url:appProperties.get("next_url"),
							success:function()
							{
								that.render();
							},
					 });
				}
			}
			else if(this.model.get("state")=="photo_particular")
			{
					
					appProperties.set({photo_particular:null});
					var photoId;
					if(!this.model.get("currentPhotoId"))
						photoId=$(this.model.get("currentDomEvent").target).attr('id');
					else
						photoId=this.model.get("currentPhotoId");
					appProperties.set({currentPhotoId:photoId});
					var thisPhoto;
					
					var url_str="https://api.instagram.com/v1/media/"+photoId+"?access_token="+appProperties.get('accessToken');
							this.tempcollection.fetch({
								dataType: 'jsonp',
								url:url_str,
								success:function()
								{
									appProperties.set({currentPhotoId:null});
									appProperties.set({photo_particular:this.tempcollection});
									that.render();
								}
						});
			}
			else if(this.model.get("state")=="photos")
			{
				if(curr_event.keyCode==null || curr_event.keyCode==13)
				{
					appProperties.set({next_url:''});
					var url_str;
					
						appProperties.set({current_tag:$('#tag_search').val().toString()});
						if(appProperties.get("current_tag"))
						{
							url_str="https://api.instagram.com/v1/tags/"+appProperties.get("current_tag")+"/media/recent?access_token="+appProperties.get('accessToken')+"&count="+appProperties.get('photo_count');
							
						}
						else
						{
							url_str="https://api.instagram.com/v1/users/self/feed?access_token="+appProperties.get('accessToken')+"&count="+appProperties.get('photo_count');
						}
						this.collection.fetch({
							dataType: 'jsonp',
							url:url_str,
							success:function()
							{
								that.render();
							}
					 });
				}
			}
	},
	
	render:function()
	{

		
		$('.load_button_block').removeClass('invisible');
		var that=this;
		that.commentcollection.fetch();
		if(appProperties.get("state")=="photos")
		{
			$(this.el).find('.photo_area').html(that.photos_template({"photocollection":this.collection.toJSON()[0].data,"appProp":appProperties,"timeago":$.timeago,"comments":that.commentcollection.toJSON()}));
			appProperties.set({next_url:this.collection.toJSON()[0].pagination.next_url});
		}
		else if(appProperties.get("state")=="loading")
		{
			$(this.el).find('.photo_area').append(this.photos_template({"photocollection":this.collection.toJSON()[0].data,"appProp":appProperties,"timeago":$.timeago,"comments":that.commentcollection.toJSON()}));
			appProperties.set({next_url:this.collection.toJSON()[0].pagination.next_url});
		}
		else if(appProperties.get("state")=="photo_particular")
		{
			$(this.el).find('.photo_area').html(this.photo_particular_template({"photo":this.tempcollection.toJSON()[0].data,"appProp":appProperties,"timeago":$.timeago,"comments":that.commentcollection.toJSON()}));
			$('.load_button_block').addClass('invisible');
		}
		
			
		
		
	},
		
	
	
	
});

var mainBlock = new MainBlock({ model: appProperties, collection:photoCollection});

Backbone.history.start({pushState: true, root:"instagram_api_test/"});

	
}
}
});