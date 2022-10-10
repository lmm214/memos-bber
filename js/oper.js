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
  $('#content').val(info.open_content)
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
  //add("要出入的文本");
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
        $("#taglist").html(tagDom).slideToggle()
      });
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
  })
})

$(document).on("click",".item-container",function () {
  var tagHtml = $(this).text()+" "
  add(tagHtml);
})
$('#getlink').click(function () {
  chrome.tabs.getSelected(null, function (tab) {
    var linkHtml = " ["+tab.title+"]("+tab.url+") "
    if(tab.url){
      add(linkHtml);
    }else{
      $.message({message: '获取失败 😂'})
    }
  });
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
      open_action: '',
      open_content: ''
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
      returnObject.open_content = items.open_content
      returnObject.open_action = items.open_action
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
function sendText() {
  get_info(function (info) {
    if (info.status) {
      //信息满足了
      $.message({message: '发送中～～'})
      //$("#content_submit_text").attr('disabled','disabled');
      let content = $('#content').val()
      $.ajax({
        url:info.apiUrl,
        type:"POST",
        data:JSON.stringify({'content': content}),
        contentType:"application/json;",
        dataType:"json",
        success: function(result){
              //发送成功
              chrome.storage.sync.set(
                { open_action: '', open_content: '' },
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
                { open_action: '', open_content: '' },
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