<script setup lang="ts">
import { useRouter } from 'vue-router'
import { definePage } from 'vue-router/experimental'

definePage({ meta: { layout: 'full' } })

const router = useRouter()
</script>

<template>
  <div class="h-full overflow-auto bg-white dark:bg-dark">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <div class="flex items-center mb-8">
        <n-button text @click="router.back()">
          <template #icon>
            <div class="i-carbon-arrow-left text-lg" />
          </template>
          返回
        </n-button>
      </div>

      <n-h1>隐私政策</n-h1>
      <n-text depth="3" class="text-sm">最后更新日期：2026年3月6日</n-text>

      <n-divider />

      <div class="flex flex-col gap-6 text-sm leading-7">
        <section>
          <n-h3>1. 引言</n-h3>
          <n-text depth="2">
            本隐私政策旨在说明 Platform（以下简称"本平台"）如何收集、使用、存储和保护您的个人信息。我们深知个人信息对您的重要性，并将尽全力保护您的个人信息安全。请您在使用本平台服务前仔细阅读本隐私政策。
          </n-text>
        </section>

        <section>
          <n-h3>2. 信息收集</n-h3>
          <n-text depth="2">
            我们可能收集以下类型的信息：
          </n-text>
          <n-ul class="mt-2">
            <n-li>账号信息：您在注册时提供的用户名、电子邮箱、手机号码等</n-li>
            <n-li>设备信息：您使用的设备型号、操作系统、浏览器类型、IP 地址等</n-li>
            <n-li>使用信息：您在使用本平台时的操作记录、访问时间、功能使用情况等</n-li>
            <n-li>上传内容：您在使用服务过程中主动上传的文件和数据</n-li>
          </n-ul>
        </section>

        <section>
          <n-h3>3. 信息使用</n-h3>
          <n-text depth="2">
            我们收集的信息将用于以下目的：
          </n-text>
          <n-ul class="mt-2">
            <n-li>为您提供、维护和改进我们的服务</n-li>
            <n-li>验证您的身份，保障账号安全</n-li>
            <n-li>向您发送服务通知和系统消息</n-li>
            <n-li>进行数据分析以改善用户体验</n-li>
            <n-li>遵守法律法规的要求</n-li>
          </n-ul>
        </section>

        <section>
          <n-h3>4. 信息存储</n-h3>
          <n-text depth="2">
            您的个人信息将存储在中华人民共和国境内的服务器上。我们将采取合理的技术和管理措施来保护您的个人信息安全，防止未经授权的访问、使用或泄露。我们将在实现本隐私政策所述目的所必需的最短期限内保留您的个人信息。
          </n-text>
        </section>

        <section>
          <n-h3>5. 信息共享</n-h3>
          <n-text depth="2">
            我们不会将您的个人信息出售给第三方。在以下情况下，我们可能会共享您的信息：
          </n-text>
          <n-ul class="mt-2">
            <n-li>获得您的明确同意后</n-li>
            <n-li>为遵守法律法规或政府部门的要求</n-li>
            <n-li>为保护本平台、用户或公众的权益、财产或安全</n-li>
          </n-ul>
        </section>

        <section>
          <n-h3>6. Cookie 和类似技术</n-h3>
          <n-text depth="2">
            本平台使用 Cookie 和类似技术来改善您的使用体验、保持登录状态和进行安全验证。您可以通过浏览器设置管理 Cookie，但禁用 Cookie 可能会影响您使用本平台的部分功能。
          </n-text>
        </section>

        <section>
          <n-h3>7. 您的权利</n-h3>
          <n-text depth="2">
            根据相关法律法规，您享有以下权利：
          </n-text>
          <n-ul class="mt-2">
            <n-li>访问和获取您的个人信息副本</n-li>
            <n-li>更正不准确的个人信息</n-li>
            <n-li>删除您的个人信息</n-li>
            <n-li>撤回您之前给予的同意</n-li>
            <n-li>注销您的账号</n-li>
          </n-ul>
        </section>

        <section>
          <n-h3>8. 未成年人保护</n-h3>
          <n-text depth="2">
            本平台的服务主要面向成年人。如果您是未满 18 周岁的未成年人，请在监护人的指导下使用本平台，并在注册或使用前取得监护人的同意。
          </n-text>
        </section>

        <section>
          <n-h3>9. 隐私政策更新</n-h3>
          <n-text depth="2">
            我们可能会不时更新本隐私政策。更新后的隐私政策将在本平台公布，并自公布之日起生效。建议您定期查阅本隐私政策，以了解我们对个人信息保护的最新规定。
          </n-text>
        </section>

        <section>
          <n-h3>10. 联系我们</n-h3>
          <n-text depth="2">
            如果您对本隐私政策有任何疑问、意见或建议，或者您希望行使您的个人信息权利，请通过本平台提供的联系方式与我们取得联系。
          </n-text>
        </section>
      </div>
    </div>
  </div>
</template>
