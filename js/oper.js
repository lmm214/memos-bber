/**
 * open_action: 打开这个页面执行的操作
 * open_text：打开这页面需要复原的输入框的内容
 */
get_info(function (info) {
  if (info.status) {
    //已经有绑定信息了，折叠
    $('#blog_info').hide()
  }
  $('#apiUrl').val(info.apiUrl)
  if (info.open_action === 'upload_image') {
    //打开的时候就是上传图片
    console.log(info.open_content)
    uploadImage(info.open_content)
  } else {
    $('#content').val(info.open_content)
  }

  //从localstorage 里面读取数据
  setTimeout(get_info, 1)
})

//监听输入结束，保存未发送内容到本地
$('#content').blur(function () {
  chrome.storage.sync.set(
    { open_action: 'save_text', open_content: $('#content').val() },
    function () {}
  )
})

//监听拖拽事件，实现拖拽到窗口上传图片
initDrag()

//监听复制粘贴事件，实现粘贴上传图片
document.addEventListener('paste', function (e) {
  let photo = null
  if (e.clipboardData.files[0]) {
    photo = e.clipboardData.files[0]
  } else if (e.clipboardData.items[0] && e.clipboardData.items[0].getAsFile()) {
    photo = e.clipboardData.items[0].getAsFile()
  }

  if (photo != null) {
    uploadImage(photo)
  }
})

function initDrag() {
  var file = null
  var obj = $('#content')[0]
  obj.ondragenter = function (ev) {
    if (ev.target.className === 'common-editor-inputer') {
      $.message({
        message: '拖拽到窗口上传该图片',
        autoClose: false
      })
      $('body').css('opacity', 0.3)
    }

    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondragover = function (ev) {
    ev.preventDefault() //防止默认事件拖入图片 放开的时候打开图片了
    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondrop = function (ev) {
    $('body').css('opacity', 1)
    ev.preventDefault()
    var files = ev.dataTransfer.files || ev.target.files
    for (var i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('image') >= 0) {
        file = files[i]
        break
      }
    }
    uploadImage(file)
  }
  obj.ondragleave = function (ev) {
    ev.preventDefault()
    if (ev.target.className === 'common-editor-inputer') {
      console.log('ondragleave' + ev.target.tagName)
      $.message({
        message: '取消上传'
      })
      $('body').css('opacity', 1)
    }
  }
}

let relistNow = []
function uploadImage(data) {
  //显示上传中的动画……
  $.message({
    message: '上传图片中……',
    autoClose: false
  })
  //根据data判断是图片地址还是base64加密的数据
  get_info(function (info) {
    const formData = new FormData()
    if (info.status) {
      formData.append('file', data)
      $.ajax({
        url: info.apiUrl.replace(/api\/memo/,'api/resource'),
        data: formData,
        type: 'post',
        cache: false,
        processData: false,
        contentType: false,
        dataType: 'json',

        success: function (result) {
          console.log(result)
          if (result.data.id) {
            //获取到图片
            relistNow.push(result.data.id)
            chrome.storage.sync.set(
              {
                open_action: '', 
                open_content: '',
                resourceIdList: relistNow
              },
              function () {
                $.message({
                  message: '上传成功'
                })
              }
            )
          } else {
            //发送失败
            //清空open_action（打开时候进行的操作）,同时清空open_content
            chrome.storage.sync.set(
              {
                open_action: '', 
                open_content: '',
                resourceIdList: []
              },
              function () {
                $.message({
                  message: '上传图片失败'
                })
              }
            )
          }
        }
      })
    } else {
      $.message({
        message: '所需要信息不足，请先填写好绑定信息'
      })
    }
  })
}

$('#saveKey').click(function () {
  // 保存数据
  chrome.storage.sync.set(
    {
      apiUrl: $('#apiUrl').val()
    },
    function () {
      $.message({
        message: '保存信息成功'
      })
      $('#blog_info').hide()
    }
  )
})

$('#tags').click(function () {
  get_info(function (info) {
    if (info.status) {
      var tagUrl = info.apiUrl.replace(/api\/memo/,'api/tag')
      var tagDom = ""
      $.get(tagUrl,function(data,status){
        var arrData = data.data
        $.each(arrData, function(i,obj){
          tagDom += '<span class="item-container">#'+obj+'</span>'
        });
        //console.log(tagDom)
        $("#taglist").html(tagDom).slideToggle(500)
      });
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
  })
})

$('#unlock,#locked').click(function () {
  get_info(function (info) {
    var nowlock = info.memo_lock
    var lockDom = '<span class="item-lock'+ (nowlock == 'PUBLIC' ? ' lock-now' : '')+'" data-type="PUBLIC">公开</span><span class="item-lock'+ (nowlock == 'PRIVATE' ? ' lock-now' : '')+'" data-type="PRIVATE">仅自己</span><span class="item-lock'+ (nowlock == 'PROTECTED' ? ' lock-now' : '')+'" data-type="PROTECTED">登录可见</span>'
    $("#visibilitylist").html(lockDom).slideToggle(500)
  })
})
$(document).on("click",".item-lock",function () {
    _this = $(this)[0].dataset.type
    if(_this !== "PUBLIC"){
      $('#locked').show()
      $('#unlock').hide()
    }else{
      $('#locked').hide()
      $('#unlock').show()
    }
    chrome.storage.sync.set(
      {memo_lock: _this},
      function () {
        $.message({
          message: '设置成功，当前为： '+ _this
        })
        $('#visibilitylist').hide()
      }
    )
})

$(document).on("click",".item-container",function () {
  var tagHtml = $(this).text()+" "
  add(tagHtml);
})

$('#getlink').click(function () {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    var linkHtml = " ["+tab.title+"]("+tab.url+") "
    if(tab.url){
      add(linkHtml);
    }else{
      $.message({message: '获取失败 😂'})
    }
  })
})

function add(str) {
  var tc = document.getElementById("content");
  var tclen = tc.value.length;
  tc.focus();
  if(typeof document.selection != "undefined"){
    document.selection.createRange().text = str;
  }else{
    tc.value = 
      tc.value.substr(0, tc.selectionStart) +
      str +
      tc.value.substring(tc.selectionStart, tclen);
  }
}

$('#blog_info_edit').click(function () {
  $('#blog_info').slideToggle()
})

function get_info(callback) {
  chrome.storage.sync.get(
    {
      apiUrl: '',
      memo_lock: 'Public',
      open_action: '',
      open_content: '',
      resourceIdList: []
      
    },
    function (items) {
      var flag = false
      var returnObject = {}
      if (items.apiUrl === '' || items.repo === '') {
        flag = false
      } else {
        flag = true
      }
      returnObject.status = flag
      returnObject.apiUrl = items.apiUrl
      returnObject.memo_lock = items.memo_lock
      returnObject.open_content = items.open_content
      returnObject.open_action = items.open_action
      returnObject.resourceIdList = items.resourceIdList

      if (callback) callback(returnObject)
    }
  )
}

//发送操作
$('#content_submit_text').click(function () {
  var contentVal = $('#content').val()
  if(contentVal){
    sendText()
  }else{
    $.message({message: '写点什么，再记呗？'})
  }
})

let lockNow = 'Public'
function sendText() {
  get_info(function (info) {
    if (info.status) {
      //信息满足了
      console.log(info.memo_lock)
      if(info.memo_lock){
        lockNow = info.memo_lock
      }
      $.message({message: '发送中～～'})
      //$("#content_submit_text").attr('disabled','disabled');
      let content = $('#content').val()
      $.ajax({
        url:info.apiUrl,
        type:"POST",
        data:JSON.stringify({
          'content': content,
          'visibility': lockNow,
          'resourceIdList': info.resourceIdList,
        }),
        contentType:"application/json;",
        dataType:"json",
        success: function(result){
              //发送成功
              console.log(result)
              chrome.storage.sync.set(
                { open_action: '', open_content: '',resourceIdList:''},
                function () {
                  $.message({
                    message: '发送成功！😊'
                  })
                  //$("#content_submit_text").removeAttr('disabled');
                  $('#content').val('')
                }
          )
      },error:function(err){//清空open_action（打开时候进行的操作）,同时清空open_content
              chrome.storage.sync.set(
                { open_action: '', open_content: '',resourceIdList:'' },
                function () {
                  $.message({
                    message: '网络问题，发送失败！😭'
                  })
                }
              )},
      })
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
  })
}  