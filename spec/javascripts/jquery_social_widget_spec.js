describe("Jquery Social Widget Constructor", function() {
  beforeEach(function() {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2015, 9-1, 16, 15, 15));
    this.feed = new ChapmanSocialFeed();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it("initializes url", function() {
    expect(this.feed.url).toBe('https://social.chapman.edu');
  });

  it("creates load more url", function() {
    expect(this.feed.load_more_url).toBe('https://social.chapman.edu/feed');
  });

  it("creates realtime subscription channel", function() {
    expect(this.feed.realtimeSubscriptionChannel()).toBe('/social')
  });

  it("initialize load_more_params", function() {
    expect(this.feed.load_more_params).toEqual({page: 1, per: 30, before: '2015-9-16-1515'});
  });
});

describe("Laying out posts in columns", function() {
  beforeAll(function(done) {
    loadFixtures('element.html');
    this.$el = $("#chapman-social-feed");
    this.$el.on('csf:load_more_success', function() { done(); });
    this.$el.chapmanSocialFeed({per: 30});
  });

  it("renders the widget", function() {
    expect($('.post_tile').length).toBe(30);
  });

  it("lays out the posts in 1 columns", function () {
    this.$el.css('width', '100px');
    this.$el.csf.layoutPostsInColumns();
    expect(this.$el.find('.column').length).toBe(1);
  });

  it("lays out the posts in 2 columns", function() {
    this.$el.css('width', 355 + 20 + 355 );
    this.$el.csf.layoutPostsInColumns();
    expect(this.$el.find('.column').length).toBe(2);
  });

  it("lays out the posts in 3 columns", function() {
    this.$el.css('width', 355 + 20 + 355 + 20 + 355);
    this.$el.csf.layoutPostsInColumns();
    expect(this.$el.find('.column').length).toBe(3);
  });

  it("lays out the posts in 4 columns", function() {
    this.$el.css('width', 355 + 20 + 355 + 20 + 355 + 20 + 355);
    this.$el.csf.layoutPostsInColumns();
    expect(this.$el.find('.column').length).toBe(4);
  });
});

describe("Appending Posts", function() {
  beforeAll(function() {
    loadFixtures('element.html');
    this.$el = $("#chapman-social-feed");
    this.$el.chapmanSocialFeed({per: 30, realtime: true});
  });

  it("csf.post_appened gets called when in post is IN the DOM with listeners", function(done) {
    this.$el.on('csf:post_appended', function(event, $post) {
      expect($post).toBeInDOM();
      expect($post.data('listeners_attached')).toBe(true);
      done();
    });
  });
});

describe("Realtime functions", function() {
  beforeEach(function(done) {
    loadFixtures('element.html');
    this.$el = $("#chapman-social-feed");
    this.$el.on('csf:load_more_success', function() { done(); });
    this.$el.chapmanSocialFeed({per: 30, realtime: true});
  });

  it("receives a post", function(done) {
    this.$el.on('csf:realtime_post_received', function(event, post) {
      expect($('.post_tile').length).toBe(31);
      done();
    });
    this.$el.csf.__realtimePostReceive(readFixtures('realtime_post.html'));
  });

  it("removes a post", function(done) {
    this.$el.on('csf:realtime_post_removed', function(event, id) {
      expect($('.post_tile').length).toBe(30);
      done();
    });
    this.$el.csf.__realtimePostReceive(readFixtures('realtime_post.html'));
    this.$el.csf.__realtimePostRemove('124290');
  });

  it("does not add duplicate posts", function(done) {
    var count = 1;
    this.$el.on('csf:realtime_post_received', function(event, post) {
      if (count === 3) {
        expect($('.post_tile').length).toBe(31);
        done();
      } else {
        count += 1;
      }
    });
    this.$el.csf.__realtimePostReceive(readFixtures('realtime_post.html'));
    this.$el.csf.__realtimePostReceive(readFixtures('realtime_post.html'));
    this.$el.csf.__realtimePostReceive(readFixtures('realtime_post.html'));
  });
});


/*
  That infinate scroll works

  Documentation on how to use the thing
*/

/*
  The various events for posts are
    'csf:initialized'

    'csf:load_more_started'  # ajax is going out (pass in url)
    'csf:load_more_error'    # something bad happend with the request for more
    'csf:load_more_success'  # we have received the posts (nothing has been done with them yet though)

    'csf:post_appended'   # The necessary listeners have been attached, and the post is now the DOM
    'csf:post_prepended'  # The necessary listeners have been attached, and the post is now in the DOM

    'csf:realtime_connecting'       # Realtime is trying to connect
    'csf:realtime_connected'       # Pass in the channel we subscribed to
    'csf:realtime_post_received'
    'csf:realtime_post_removed'
*/