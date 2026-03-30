import { ElNotification,ElMessageBox,ElMessage} from 'element-plus'
// import NProgress from 'nprogress'
// //加载进度条
// export function showProgress(){
//     NProgress.start()
// }
// //关闭进度条
// export function hideProgress(){
//     NProgress.done()
// }
//如下是右上侧提示
export function msgSuccess(msg: string) {
    ElNotification({
        message: msg,
        type: 'success',
    })
}

export function msgError(msg: string) {
    ElNotification({
        message: msg,
        type: 'error',
    })
}

export function msgWarning(msg: string) {
    ElNotification({
        message: msg,
        type: 'warning',
    })
}

export function msgInfo(msg: string) {
    ElNotification({
        message: msg,
        type: 'info',
      })
}
//居中消息弹窗
export function warningNotice(msg: string,title: string,ensure: string,cancel: string) {
   return ElMessageBox.confirm(msg,title,{
        confirmButtonText: ensure,
        cancelButtonText: cancel,
        type: 'warning',
    })
}
//上侧消息提示
export function elMsgSuccess(msg: string) {
    ElMessage({
        type: 'success',
        message: msg,
    })
}
export function elMsgWarning(msg: string) {
    ElMessage({
        type: 'warning',
        message: msg,
    })
}
export function elMsgError(msg: string) {
    ElMessage({
        type: 'error',
        message: msg,
    })
}
