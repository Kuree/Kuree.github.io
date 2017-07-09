Vue.use(VueMaterial);

const Main = {
    template: "#main",
    data: function() {
        return {
            "profile": this.$parent.profile
        }
    }
};
const Publication = {
    template: "#publication",
    data: function() {
        return {
            "papers": [],
        }
    },
    created: function() {
        this.fetchPaper();
    },
    methods: {
        fetchPaper() {
            this.$http.get("/assets/data/papers.json").then(response => {
                this.papers = response.body.sort(function(a, b) {
                    return b.date - a.date
                });
            }, response => {
                this.$parent.error_http();
            });
        },
        openPDF(pdf){
            window.open("/assets/pdf/" + pdf, '_blank');
        }
    }
};
const Timeline = {
    template: "#timeline",
    data: function() {
        return {
            "timeline": []
        }
    },
    created: function() {
        this.fetchEvents();
    },
    methods: {
        fetchEvents() {
            this.$http.get("/assets/data/timeline.json").then(response => {
                this.timeline = response.body.sort(function(a, b) {
                    return b.date - a.date
                });
            }, response => {
                this.$parent.error_http();
            });
        }
    }
};
const Blogs = {
    template: "#blogs",
    data: function() {
        return {
            "blogs": []
        }
    },
    created: function() {
        this.fetchPosts();
    },
    methods: {
        fetchPosts() {
            this.$http.get("/assets/data/blogs.json").then(response => {
                this.blogs = response.body.sort(function(a, b) {
                    return b.date - a.date
                });
            }, response => {
                this.$parent.error_http();
            });
        }
    }
}
const BlogPage = {
    template: "#blog-page",

    data: function() {
        return {
            post: null
        }
    },
    created() {
        this.fetchData()
    },
    methods: {
        fetchData() {
            this.$http.get("/posts/" + this.$route.params.id + ".json").then(response => {
                this.post = response.body;
            }, response => {
                this.$parent.error_http();
            });
        }
    }
}
const ErrorPage = {
    template: "#error_page"
}

const ChatPage = {
    template: "#chat-page",
    data: function() {
        return {
            "chat_history": this.$parent.chat_history,
            "query": "",
            "api_ai_token": this.$parent.profile.api_ai_token
        };
    },
    methods: {
        sendQuery() {
            if (this.query) {
                this.connectAPI(this.query);
                this.query = "";
            }
        },
        connectAPI(query) {
            var sendData = JSON.stringify({
                query: query,
                lang: "en",
                sessionId: "somerandomthing"
            });
            var accessToken = this.api_ai_token;
            var baseUrl = "https://api.api.ai/api/";
            var headers = {
                "Authorization": "Bearer " + accessToken,
                "Content-type": "application/json; charset=utf-8"
            }

            this.$http.post(baseUrl + "query?v=20150910", sendData, {
                "headers": headers
            }).then(response => {
                var reply = response.body;
                var history = this.chat_history;
                // push self text
                history.push({
                    "text": reply.result.resolvedQuery,
                    "index": history.length,
                    "self": true
                });;
                // add response
                var messages = reply.result.fulfillment.messages;
                for (var i = 0; i < messages.length; i++) {
                    var msg = messages[i];
                    if (msg.platform === undefined) {
                        history.push({
                            "text": msg.speech,
                            "index": history.length
                        });
                    }
                }

                // update scool
                this.$nextTick(function() {
                    var element = document.getElementById("msg-" + (history.length - 1).toString());
                    element.scrollIntoView();
                });
            }, response => {
                this.$parent.error_http();
            });

        }
    }
}
Vue.component("event-card", {
    props: ["event"],
    template: "#event-card"
})

const routes = [{
    path: "/",
    component: Main
}, {
    path: "/publication",
    component: Publication
}, {
    path: "/timeline",
    component: Timeline
}, {
    path: "/blog",
    component: Blogs
}, {
    path: "/blog/:id",
    component: BlogPage
}, {
    path: "/chat",
    component: ChatPage
}, {
    path: "*",
    component: ErrorPage
}];

const router = new VueRouter({
    routes: routes,
    mode: "history"
});

router.afterEach((to, from) => {
    if (router.apps[0].$data) {
        router.apps[0].$data.active_path = to.path;
    }
});

new Vue({
    router: router,
    data: {
        "active_path": "/",
        "profile": {
            "name": "Keyi Zhang",
            "desc": "I am a PhD student in Computer Science at Stanford University. My undergrad was at Bucknell University, where I did independent researches under Dr. Alan Marchiori. Go Bison! Besides computer science, I enjoy playing video games and hanging out with friends.",
            "profile_desc": "Picture with Donald Knuth.",
            "email_user": "hi",
            "email_domain": "keyizhang.com",
            "linkedin": "https://www.linkedin.com/in/keyizhang/",
            "github": "https://github.com/Kuree",
            "api_ai_token": "049d579a5be5446db4367fde4730a579"

        },
        "nav": null,
        "chat_history": []
    },
    created: function() {
        this.fetchNavs();
        //this.fetchProfile();
    },
    methods: {
        fetchNavs() {
            this.$http.get("/assets/data/nav.json").then(response => {
                this.nav = response.body;
            }, response => {
                this.$parent.error_http();
            });
            //this.error_http();
        },
        fetchProfile() {
            this.$http.get("/assets/data/profile.json").then(response => {
                this.profile = response.body;
            }, response => {
                this.$parent.error_http();
            });
        },
        toggleLeftSidenav() {
            this.$refs.leftSidenav.toggle();
        },
        showLoading() {
            document.getElementById("loading-bg").style.display = "block";
        },
        removeLoading() {
            document.getElementById("loading-bg").style.display = "none";
        },
        jumpPage(url, index) {
            this.$router.push(url);
            // fix for vue material bug
            //await this.sleep(100);
            Vue.nextTick(function() {
                // DOM updated
                document.getElementById("btn-" + index.toString()).className += " md-active";
            });
        },
        error_http() {
            this.$router.push("/404");
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    },
    mounted: function() {
        this.removeLoading();
    }
}).$mount("#app");
