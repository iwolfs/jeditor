(function($){

	var E = window.JEditor;

	// 自定义上传视频菜单
	E.createMenu(function(check){
		var menuId = 'video';
		if(!check(menuId)){
			return;
		}
		var editor = this;
		var lang = editor.config.lang;
		var $dot = $('<div class="menu-dot" style="display:none;"></div>');

		var menu = new E.Menu({
			editor: editor,
			id: menuId,
			title: lang.video,

			$domNormal: $('<a href="#" tabindex="-1"><i class="jeditor-icon-play"></i></a>'),
			$domSelected: $('<a href="#" tabindex="-1" class="selected"><i class="jeditor-icon-play"></i></a>'),
			$dot: $dot
		});
        
		// Create panel content
		var $panelContent = $('<div class="panel-tab"></div>');
		var $tabContainer = $('<div class="tab-container"></div>');
		var $contentContainer = $('<div class="content-container"></div>');
		$panelContent.append($tabContainer,$contentContainer);

		// Create Tab
		var $uploadTab = $('<a>上传视频</a>');
		var $networkTab = $('<a>网络视频</a>');
		$tabContainer.append($uploadTab, $networkTab);

		// Upload Content
		var $uploadContent = $('<div class="content"></div>');
		$contentContainer.append($uploadContent);

		// Network Content
		var $networkContent = $('<div class="content"></div>');
		$contentContainer.append($networkContent);
        networkContentHandler(editor, menu, $networkContent);

		menu.dropPanel = new E.DropPanel(editor, menu, {
			$content: $panelContent,
			width: 400,
			onRender: function(){
				// 渲染后的回调事件，用于执行自定义上传的init
                // 因为渲染之后，上传面板的dom才会被渲染到页面，才能让第三方空间获取到
                var init = editor.config.customUploadInit;
                init && init.call(editor);
			}
		});

		editor.menus[menuId] = menu;

	    // $dot.click(function(event) {
	    //     var index = $.trim($dot.text()) || 0
	    //     $dot.text(Number(++index))
	    // });

		function tabToggle(){

			$uploadTab.click(function(event) {
				$uploadContent.addClass('selected').siblings().removeClass('selected');
				$uploadTab.addClass('selected').siblings().removeClass('selected');
			});
			$networkTab.click(function(event) {
				$networkContent.addClass('selected').siblings().removeClass('selected');
				$networkTab.addClass('selected').siblings().removeClass('selected');

				// focus input
                if (E.placeholder) {
                    $networkContent.find('.network-container input[type=text]').focus();
                }
			});

			$uploadTab.click();
		}

		function hideUpload(){
			$tabContainer.hide();
			$uploadContent.hide();
			$networkContent.addClass('selected');
		}


		editor.ready(function(){
			var editor = this;
			var config = editor.config;
			var uploadUrl = config.uploadImgUrl;
			var customUpload = config.customUpload;

			if(uploadUrl || customUpload){
				editor.$uploadContentVideo = $uploadContent;

				tabToggle();
			}else{
				hideUpload();
			}

			$uploadContent.click(function(event) {
				setTimeout(function(){
					menu.dropPanel.show();	//上传时不隐藏下拉菜单面板
				});
			});
		});


		//解析获得优酷土豆等网络视频地址
        function analysisUrl(url){
            //url = 'http://v.youku.com/v_show/id_XMTM4OTY5MzE4MA==.html?f=26036779&from=y1.3-paike-grid-4071-10195.90404-90171.1-1';
            //url = 'http://www.tudou.com/albumplay/PwXOasQZtko/yL_RR_6461k.html'
            var source = {
                youku:{
                    name: 'youku',
                    domain: '.youku.com',
                    videoUrl: 'http://player.youku.com/embed/{{video_id}}'
                },
                tudou:{
                    name: 'tudou',
                    domain: '.tudou.com',
                    videoUrl: 'http://www.tudou.com/programs/view/html5embed.action?code={{code}}&lcode={{lcode}}'
                }
            };

            var retUrl = '';
            var sourceName = '';
            var startIndex,endIndex,video_id,subUrl,codeArr,code,lcode;

            for(var i in source){
                if(url.indexOf(source[i].domain) >= 0){
                    sourceName = source[i].name;
                    break;
                }
            }

            switch(sourceName){
                case source.youku.name:
                    startIndex = url.indexOf('\/id_') + '\/id_'.length ;
                    endIndex = url.indexOf('.html');
                    video_id = url.substring(startIndex,endIndex);
                    retUrl = source.youku.videoUrl.replace('{{video_id}}',video_id);
                    break;
                case source.tudou.name:
                    startIndex = url.indexOf('http://') + 'http://'.length;
                    endIndex = url.lastIndexOf('.html');
                    subUrl = url.substring(startIndex,endIndex);
                    codeArr = subUrl.split('/');
                    code = codeArr[3];
                    lcode = codeArr[2];
                    retUrl = source.tudou.videoUrl.replace('{{code}}',code).replace('{{lcode}}',lcode);
                    break;
            }
            return retUrl;
        }

		//判断视频是否是来自优酷土豆等
		function isNetworkVideo(url){
			var networks = ['v.youku.com','www.tudou.com'];
			return networks.some(function(v){
				return url.indexOf(v) >= 0;
			});
		}

		function getValidUrl(url){
			var validUrl;
        	var reg = /^<(iframe)|(embed)/i;  // <iframe... 或者 <embed... 格式
			if(reg.test(url)){
				//如果是iframe或者embed，直接获取src
				var $dom = $(url);
				validUrl = $dom.attr('src');
			}else{
				if(isNetworkVideo(url)){
					validUrl = analysisUrl(url);
				}else{
					validUrl = '';
				}
			}
			return validUrl;
		}

		function networkContentHandler(editor, menu, $networkContent){
			var lang = editor.config.lang;
			var $urlContainer = $('<div class="network-container"></div>');
			var $urlInput = $('<input type="text" class="block" placeholder="请在这里填写视频地址或者iframe">');
			$urlContainer.append($urlInput);

			var $txtPreview = $('<span><i class="wangeditor-menu-img-video-camera"></i> 视频预览</span>');
			var $previewContainer = $('<div class="content-preview" style="height: 200px;"></div>');
			$previewContainer.append($txtPreview);

			var $sizeContainer = $('<div style="margin:20px 10px;"></div>');
			var $widthInput = $('<input type="text" value="640" style="width:50px;text-align:center;"/>');
			var $heightInput = $('<input type="text" value="498" style="width:50px;text-align:center;"/>');
			$sizeContainer.append('<span> ' + lang.width + ' </span>')
			              .append($widthInput)
			              .append('<span> px &nbsp;&nbsp;&nbsp;</span>')
			              .append('<span> ' + lang.height + ' </span>')
			              .append($heightInput)
			              .append('<span> px </span>');

        	var $btnSubmit = $('<button class="right">' + lang.submit + '</button>');
        	var $btnCancel = $('<button class="right gray">' + lang.cancel + '</button>');
        	$networkContent.append($urlContainer,$previewContainer,$sizeContainer, $btnSubmit, $btnCancel);

        	var videoUrl = '';

          // $urlInput.bind('input propertychange', function(evnet){
        	$urlInput.bind('change', function(evnet){
        		var url = $.trim($(this).val());

        		videoUrl = getValidUrl(url);
            if(videoUrl === '') {
              alert('请输入正确的优酷土豆视频网址！')
            } else {
          		var iframe = '<iframe src="'+ videoUrl +'" width="100%" height="100%" frameborder=0 allowfullscreen/>';
          		$previewContainer.empty().append(iframe);
            }

        	});

        	$widthInput.bind('input propertychange', function(event){
        		var value = $.trim($widthInput.val());
        		$widthInput.val(value.replace(/[^\d]/g,''));
        	});

        	$heightInput.bind('input propertychange', function(event){
        		var value = $heightInput.val();
        		$heightInput.val(value.replace(/[^\d]/g,''));
        	});

        	$btnCancel.click(function(event) {
        		event.preventDefault();
        		menu.dropPanel.hide();
        	});

        	function callback() {
	            $urlInput.val('');
	        }

        	$btnSubmit.click(function(event) {
        		event.preventDefault();	
        		var text = $.trim($urlInput.val());
        		var w = $.trim($widthInput.val()) || 640;
        		var h = $.trim($heightInput.val()) || 498;

        		if(!text){
        			$urlInput.focus();
        			return;
        		}

        		var iframe = '<iframe src="'+ videoUrl +'" width="'+ w +'" height="'+ h +'" frameborder=0 allowfullscreen/>';
        		editor.command(event, 'insertHtml',iframe,callback);
        		$urlInput.val('');
        		$previewContainer.empty().append($txtPreview);
        	});
		}

	});


	// 上传图片事件
    E.plugin(function () {
        var editor = this;
        var fns = editor.config.uploadVideoFns; // editor.config.uploadVideoFns = {} 在config文件中定义了

        // -------- 定义load函数 --------
        fns.onload || (fns.onload = function (resultText, xhr) {
            E.log('上传结束，返回结果为 ' + resultText);

            var editor = this;
            var img;
            if (resultText.indexOf('error|') === 0) {
                // 提示错误
                E.warn('上传失败：' + resultText.split('|')[1]);
                alert(resultText.split('|')[1]);
            } else {
                E.log('上传成功，即将插入编辑区域，结果为：' + resultText);

                var resultJson = JSON.parse(resultText);
                resultText = resultJson.data.fileUrl;

                // var menuVideo = editor.menus['video'];
                // var $dot = menuVideo.$dot;

                // $dot.text('1').show();

                // 隐藏进度条
                editor.hideUploadProgressVideo(resultText);

                //var html = '<iframe src="' + resultText + '" style="width:640px; height:498px; max-width:100%;" frameborder=0 allowfullscreen/>';
                //editor.command(null, 'insertHtml', html);

                E.log('已插入视频，地址 ' + resultText);

                // 将结果插入编辑器
                // iframe = document.createElement('iframe');
                // iframe.onload = function () {
                //     var html = '<iframe src="' + resultText + '" style="width:640px; height:498px; max-width:100%;" frameborder=0 allowfullscreen/>';
                //     editor.command(null, 'insertHtml', html);

                //     E.log('已插入视频，地址 ' + resultText);
                //     img = null;
                // };
                // iframe.onerror = function () {
                //     E.error('使用返回的结果获取视频，发生错误。请确认以下结果是否正确：' + resultText);
                //     img = null;
                // };
                // iframe.src = resultText;
            }

        });

        // -------- 定义tiemout函数 --------
        fns.ontimeout || (fns.ontimeout = function (xhr) {
            E.error('上传视频超时');
            alert('上传视频超时');
        });

        // -------- 定义error函数 --------
        fns.onerror || (fns.onerror = function (xhr) {
            E.error('上传上视频发生错误');
            alert('上传上视频发生错误');
        });

    });


    // xhr 上传视频
    E.plugin(function () {
		if (!window.FileReader || !window.FormData) {
	        // 如果不支持html5的文档操作，直接返回
	        return;
	    }
        var editor = this;
        var config = editor.config;
        var uploadImgUrl = config.uploadImgUrl;
        var uploadTimeout = config.uploadTimeout;

        // 获取配置中的上传事件
        var uploadVideoFns = config.uploadVideoFns;
        var onload = uploadVideoFns.onload;
        var ontimeout = uploadVideoFns.ontimeout;
        var onerror = uploadVideoFns.onerror;

        if (!uploadImgUrl) {
            return;
        }

        // -------- 将以base64的图片url数据转换为Blob --------
        function convertBase64UrlToBlob(urlData, filetype){
            //去掉url的头，并转换为byte
            var bytes = window.atob(urlData.split(',')[1]);
            
            //处理异常,将ascii码小于0的转换为大于0
            var ab = new ArrayBuffer(bytes.length);
            var ia = new Uint8Array(ab);
            var i;
            for (i = 0; i < bytes.length; i++) {
                ia[i] = bytes.charCodeAt(i);
            }

            return new Blob([ab], {type : filetype});
        }

        // -------- 插入图片的方法 --------
        function insertImg(src, event) {
            var img = document.createElement('img');
            img.onload = function () {
                var html = '<img src="' + src + '" style="max-width:100%;"/>';
                editor.command(event, 'insertHtml', html);

                E.log('已插入视频，地址 ' + src);
                img = null;
            };
            img.onerror = function () {
                E.error('使用返回的结果获取视频，发生错误。请确认以下结果是否正确：' + src);
                img = null;
            };
            img.src = src;
        }

        // -------- onprogress 事件 --------
        function updateProgress(e) {
            if (e.lengthComputable) {
                var percentComplete = e.loaded / e.total;
                editor.showUploadProgressVideo(percentComplete * 100);
            }
        }



        // -------- xhr 上传视频 --------
        editor.xhrUploadVideo = function (opt) {
            // opt 数据
            var event = opt.event;
            var fileName = opt.filename || '';
            var base64 = opt.base64;
            var fileType = opt.fileType || 'video/mp4'; // 无扩展名则默认使用 mp4
            var name = opt.name || 'wangEditor_upload_file';
            var loadfn = opt.loadfn || onload;
            var errorfn = opt.errorfn || onerror;
            var timeoutfn = opt.timeoutfn || ontimeout;


            // 上传参数（如 token）
            var params = editor.config.uploadParamsVideo || {};

            // 获取文件扩展名
            var fileExt = 'mp4';  // 默认为 mp4
            if (fileName.indexOf('.') > 0) {
                // 原来的文件名有扩展名
                fileExt = fileName.slice(fileName.lastIndexOf('.') - fileName.length + 1);
            } else if (fileType.indexOf('/') > 0 && fileType.split('/')[1]) {
                // 文件名没有扩展名，通过类型获取，如从 'video/mp4' 取 'mp4'
                fileExt = fileType.split('/')[1];
            }

            // ------------ begin 预览模拟上传 ------------
            if (E.isOnWebsite) {
                E.log('预览模拟上传');
                insertImg(base64, event);
                return;
            }
            // ------------ end 预览模拟上传 ------------

            // 变量声明
            var xhr = new XMLHttpRequest();
            var timeoutId;
            var src;
            var formData = new FormData();

            // 超时处理
            function timeoutCallback() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (xhr && xhr.abort) {
                    xhr.abort();
                }

                // 超时了就阻止默认行为
                event.preventDefault();

                // 执行回调函数，提示什么内容，都应该在回调函数中定义
                timeoutfn && timeoutfn.call(editor, xhr);

                // 隐藏进度条
                editor.hideUploadProgressVideo();
            }

            xhr.onload = function () {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                // 执行load函数，任何操作，都应该在load函数中定义
                loadfn && loadfn.call(editor, xhr.responseText, xhr);

                // 隐藏进度条
                editor.hideUploadProgressVideo();
            };
            xhr.onerror = function () {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                // 超时了就阻止默认行为
                event.preventDefault();

                // 执行error函数，错误提示，应该在error函数中定义
                errorfn && errorfn.call(editor, xhr);

                // 隐藏进度条
                editor.hideUploadProgressVideo();
            };
            // xhr.onprogress = updateProgress;
            xhr.upload.onprogress = updateProgress;

            // 填充数据
            //formData.append(name, convertBase64UrlToBlob(base64, fileType), E.random() + '.' + fileExt);

            // Page api粘贴上传所需base64参数
            //params.fileStr = base64.substring(base64.indexOf('base64,')+7);
            // delete params.fileStr;
            params.file = opt.file;
            //params.type = 1;

            // 添加参数
            $.each(params, function (key, value) {
                formData.append(key, value);
            });


            // 开始上传
            xhr.open('POST', uploadImgUrl, true);
            xhr.send(formData);
            timeoutId = setTimeout(timeoutCallback, uploadTimeout);

            // 终止上传
            editor.xhrUploadVideoAbort = function(){
            	if(timeoutId){
            		clearTimeout(timeoutId);
            	}
            	xhr.abort();
            };

            E.log('开始上传...并开始超时计算');
        };
    });


	// 自定义视频上传进度条
    E.plugin(function () {

        var editor = this;
        var menuContainer = editor.menuContainer;
        var menuHeight = menuContainer.height();
        var $editorContainer = editor.$editorContainer;
        var $uploadContentVideo = editor.$uploadContentVideo;
        
        var $progress,$percentage,$progressLabel,$completePreview,$completeLabel,$btnCompleteCancel,$btnCompleteInsert,$dot;

        // 当前上传的视频返回url
        var currVideoUrl = '';

        // 渲染事件
        var isRender = false;
        function render() {
            if (isRender) {
                return;
            }
            isRender = true;

            $progress = $uploadContentVideo.find('.upload-progress');
            $percentage = $uploadContentVideo.find('.percentage');
            $progressLabel = $uploadContentVideo.find('.progress-label');

            $completePreview = $uploadContentVideo.find('.complete-preview');
            $dot = editor.menus.video.$dot;
        }

        // ------ 显示进度 ------
        editor.showUploadProgressVideo = function (progress) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // 显示之前，先判断是否渲染
            render();

            //$progress.show();
            //$progress.width(progress * width / 100);
           	$uploadContentVideo.addClass('progress');
           	$percentage.css('width',progress + '%');
           	$progressLabel.text('正在上传...('+ parseInt(progress) +'%)');

           	$dot.show().text(parseInt(progress) +'%');
        };

        // ------ 隐藏进度条 ------
        var timeoutId;
        function hideProgress() {
            $progress.hide();
            timeoutId = null;
        }
        // editor.hideUploadProgress = function (time) {
        //     if (timeoutId) {
        //         clearTimeout(timeoutId);
        //     }
        //     time = time || 750;
        //     timeoutId = setTimeout(hideProgress, time);
        // };

        editor.hideUploadProgressVideo = function(url){
        	$uploadContentVideo.removeClass('progress');
        	if(url){
        		currVideoUrl = url;
        		$uploadContentVideo.addClass('complete');
        		var $iframe = $('<iframe src="'+ currVideoUrl +'" width="100%" height="100%" frameborder="0" allowfullscreen/>');
        		$completePreview.empty().append($iframe);
        	}
        };

    });

	// 自定义上传视频插件
	E.plugin(function(){
		var editor = this;
		var config = editor.config;
		var uploadUrl = config.uploadImgUrl;
		var uploadTimeout = config.uploadTimeout;

		if(!uploadUrl){
			return;
		}

		var $uploadContent = editor.$uploadContentVideo;
		if(!$uploadContent){
			return;
		}

        // 小红点提示
        var $dot = editor.menus.video.$dot;
        // 上传滚动条容器
        var $progressContainer = $('<div class="upload-progress-container"></div>');
        var $progress = $('<div class="upload-progress"></div>');
        var $percentage = $('<div class="percentage" style="width:30%"></div>');
        var $progressLabel = $('<div class="progress-label">正在上传...(30%)</div>');
        var $btnCancel = $('<a class="btn-upload-cancel">取消</a>');
        $progress.append($percentage);
        $progressContainer.append($progress,$progressLabel,$btnCancel);

        //上传完成处理容器
        var $uploadCompleteContainer = $('<div class="upload-complete-container"></div>');
        var $completePreview = $('<div class="complete-preview"></div>');
        var $completeLabel = $('<div class="complete-label">视频上传完成 100%</div>');
        var $completeBtns = $('<div class="complete-btns"></div>');
        var $btnCompleteCancel = $('<a class="btn-complete-cancel">取消</div>');
        var $btnCompleteInsert = $('<a class="btn-complete-insert">插入</div>');
        $completeBtns.append($btnCompleteCancel,$btnCompleteInsert);
        $uploadCompleteContainer.append($completePreview,$completeLabel,$completeBtns);
        

		// 自定义UI，并添加到上传dom节点上
		var $uploadIconBtn = $('<div class="upload-icon-container"><span class="upload-icon-button"><i class="wangeditor-menu-img-upload"></i> 上传本地视频</span></div>');
		$uploadContent.append($uploadIconBtn,$progressContainer,$uploadCompleteContainer);


		// ---------- 构建上传对象 ----------------
		var upfileVideo = new E.UploadFile({
			editor: editor,
			uploadUrl: uploadUrl,
			timeout: uploadTimeout,
			fileAccept: 'video/mp4, video/flv, video/f4v, video/ogg, video/webm, video/m3u8',
			multipe: false,
			xhrUpload: editor.xhrUploadVideo,
			uploadFns: editor.config.uploadVideoFns
		});

		$uploadIconBtn.click(function(event) {
			upfileVideo.selectFiles();
		});


        $btnCancel.click(function(event) {
            event.stopPropagation();
            editor.xhrUploadVideoAbort();   //终止xhr上传
            $uploadContent.removeClass('progress');
            $dot.hide();
            upfileVideo.clear();
            console.log('手动终止上传(点击取消按钮)');
        });

        $btnCompleteCancel.click(function(event) {
            $uploadContent.removeClass('complete');
            $dot.hide();
            console.log('取消插入!');
        });

        $btnCompleteInsert.click(function(event) {
            var url = $completePreview.find('iframe').attr('src');
            if(url){
                var html = '<iframe src="' + url + '" style="width:640px; height:498px; max-width:100%;" frameborder=0 allowfullscreen/>';
                editor.command(null, 'insertHtml', html);
                $uploadContent.removeClass('complete');
                $completePreview.empty();
                editor.menus.video.$dot.hide();
            }
        });
                
	});
})(window.jQuery);
