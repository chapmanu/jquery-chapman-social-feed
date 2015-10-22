ChapmanSocialFeed = function(options) {
  this.url               = this.parseUrl(options.url);
  this.$container        = options.$container;
  this.post_width        = options.post_width   || 355;
  this.gutter_width      = options.gutter_width || 20;
  this.max_columns       = options.max_columns  || 4;
  this.animation_queue   = [];
  this.currently_loading = false;
  this.load_more_params  = {
    page:   options.page  || 1,
    per:    options.per   || 30,
    before: this.currentTimeAsParam()
  }
  this.selectors = {
    posts: '.post_tile',
    columns: '.column',
    new_ribbons: '.new_ribbon'
  };

  this.resize_timer = null;
  $(window).on('resize', this.onResize.bind(this));
};

ChapmanSocialFeed.prototype.initialize = function() {
  if (this.$container.children().length == 0) {
    this.$container.html(this.createNewColumns());
    this.loadMore();
  } else { // The first page of social posts has already been loaded
    this.layoutPostsInColumns({animate: true});
    this.load_more_params.page += 1;
  }
};




/***********************************************************************
 * Functions for laying out the posts into columns
 */

ChapmanSocialFeed.prototype.layoutPostsInColumns = function(options) {
  var use_animation   = (options && options.animate);
  var $posts          = (options && options.$posts) ? options.$posts : this.$container.find(this.selectors.posts);
  var scroll_position = $(window).scrollTop();

  this.sortPosts($posts);
  if (use_animation) {
    $posts.css('opacity', 0);
    this.addToAnimationQueue($posts);
  }
  this.$container.html(this.createNewColumns());
  this.appendPosts($posts);
  this.attachPostListeners($posts);
  if (use_animation) {
    this.animatePosts();
  }
  $(window).scrollTop(scroll_position);
};

ChapmanSocialFeed.prototype.sortPosts = function($posts) {
  $posts.sort(function(a, b) {
    return new Date($(b).data('timestamp')) - new Date($(a).data('timestamp'));
  });
};

ChapmanSocialFeed.prototype.detectNumberOfColumns = function() {
  var calculated =  Math.floor(this.$container.width() /  this.post_width);
  if (calculated < 1){
    return 1;
  }
  else if (calculated <= this.max_columns){
    return calculated
  }
  else {
    return this.max_columns;
  }
};

ChapmanSocialFeed.prototype.createNewColumns = function() {
  var column_divs = '';
  for (var i = 0; i < this.detectNumberOfColumns(); ++i) {
    column_divs += '<div class="column" id="social-feed-column-'+i+'"/>';
  }
  return $(column_divs);
};

ChapmanSocialFeed.prototype.appendPosts = function($posts) {
  var $columns = this.$container.find(this.selectors.columns);
  var self = this;
  $posts.each(function() {
    self.appendPostToShortestColumn($(this), $columns);
  });
};

ChapmanSocialFeed.prototype.appendPostToShortestColumn = function($post, $columns) {
  var column_heights = $.map($columns, function(col) { return $(col).height(); });
  var min_index = column_heights.indexOf(Math.min.apply(Math, column_heights));
  $columns.eq(min_index).append($post);
};

ChapmanSocialFeed.prototype.prependPosts = function ($posts) {
  var self = this
  $posts.each(function() { self.prependPost($(this)); });
  this.layoutPostsInColumns();
  this.animatePosts({reverse: true});
};

ChapmanSocialFeed.prototype.prependPost = function($post) {
  $post.prepend('<span class="new_ribbon">NEW</span>');
  var $dup = $("#"+$post[0].id);
  if ($dup.length > 0) {
    $dup.html($post.html());
  } else {
    $post.css('opacity', 0);
    this.addToAnimationQueue($post);
    this.$container.prepend($post);
  }
  this.$container.trigger('new_post_added', [$post]);
};

ChapmanSocialFeed.prototype.attachPostListeners = function($posts) {
  $posts.each(function(){
    if ($(this).hasClass('post_photo')) {
      $(this).find('.view_message').on('mouseenter', function(e){
        $(this).siblings('.message').stop().slideDown(200);
      });
      $(this).find('.message').on('mouseleave', function(e){
        $(this).stop().slideUp(400);
      });
      $(this).on('mouseleave', function(e){
        $(this).children('.message').stop().slideUp(400);
      });
    }
  });
};

ChapmanSocialFeed.prototype.addToAnimationQueue = function($posts) {
  var self = this;
  $posts.each(function(){
    self.animation_queue.push(this.id);
  });
};

ChapmanSocialFeed.prototype.animatePosts = function(options) {
  options = options || {};
  if (this.animation_queue.length === 0) {
    $(this.selectors.posts).css('opacity', 1);  // Just in case we missed some
    return;
  }
  var id = (options.reverse) ? this.animation_queue.pop() : this.animation_queue.shift();
  $('#' + id).css('opacity', 1);
  var self = this;
  setTimeout(function(){ self.animatePosts(options); }, 10);
};

ChapmanSocialFeed.prototype.removeNewRibbons = function() {
  $(this.selectors.new_ribbons).fadeOut(1000);
};




/************************************************************************************
 * Functions for loading more posts from the server
 */

ChapmanSocialFeed.prototype.loadMore = function() {
  if (this.currently_loading) return 'Already Requested';
  this.currently_loading = true;
  var self = this;
  $.ajax({
    url: this.url,
    method: 'get',
    data: self.load_more_params,
    crossDomain: true,
    success: function(posts) {
      var $posts = $(posts);
      $posts.css('opacity', 0);
      self.addToAnimationQueue($posts);
      self.appendPosts($posts);
      self.attachPostListeners($posts);
      self.animatePosts();
      self.load_more_params.page += 1;
      self.currently_loading = false;
      self.$container.trigger('more_posts_added', [$posts]);
    },
    error: function() {
      console.log("Error loading most posts");
    }
  });
};

ChapmanSocialFeed.prototype.currentTimeAsParam = function() {
  var now = new Date();
  return [now.getFullYear(), now.getMonth()+1, now.getDate(), now.getHours().toString() + now.getMinutes().toString()].join("-")
}


/**
  * Converts the url passed in, into the url that we will make our ajax reqest to.
  */
ChapmanSocialFeed.prototype.parseUrl = function(url) {
  var parser  = document.createElement('a');
  parser.href = url;
  parser.pathname += 'feed';
  return parser.href;
}

/***********************************************************************************
 * Event listener functions
 */

ChapmanSocialFeed.prototype.onResize = function(e) {
  var self = this;
  clearTimeout(self.resize_timer);
  self.resize_timer = setTimeout(function() {
    self.layoutPostsInColumns();
  }, 100);
};


/***********************************************************************************
 * The jQuery Function
 */

$.fn.chapmanSocialFeed = function(options) {
  var self = this;
  var feed = new ChapmanSocialFeed($.extend(options, {$container: this}));
  feed.initialize();
  return this;
};